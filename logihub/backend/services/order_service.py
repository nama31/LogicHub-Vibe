"""Сервис заказов."""

from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from constants.price import som_to_tiyins, tiyins_to_som
from models.order_status_log import OrderStatusLog
from models.product import Product
from models.user import User
from schemas.order import OrderCreate, OrderUpdate
from models.order import Order
from uuid import UUID

async def get_orders(
    db: AsyncSession, 
    status: str | None = None, 
    courier_id: UUID | None = None
) -> List[Order]:
    """Получить заказы с фильтрацией."""

    statement = (
        select(Order)
        .options(selectinload(Order.product), selectinload(Order.courier))
        .order_by(Order.created_at.desc())
    )

    if status:
        statement = statement.where(Order.status == status)
    if courier_id:
        statement = statement.where(Order.courier_id == courier_id)

    result = await db.execute(statement)
    orders = list(result.scalars().all())
    _serialize_orders(orders)
    return orders

async def get_order_by_id(id: int, db: AsyncSession) -> Order:
    """Получить заказ по ID."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.product), selectinload(Order.courier))
        .where(Order.id == id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    _serialize_order(order)
    return order

async def get_order_timeline(id: int, db: AsyncSession) -> List[OrderStatusLog]:
    """Получить историю статусов заказа."""
    result = await db.execute(
        select(OrderStatusLog)
        .where(OrderStatusLog.order_id == id)
        .order_by(OrderStatusLog.changed_at.asc())
    )
    return list(result.scalars().all())

async def create_order(data: OrderCreate, db: AsyncSession, changed_by: User | None = None) -> Order:
    """Создать заказ."""

    product = await db.get(Product, data.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.stock_quantity < data.quantity:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Insufficient stock")

    courier_id = data.courier_id
    if courier_id is not None:
        courier = await db.get(User, courier_id)
        if courier is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Courier not found")
        if courier.role != "courier":
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Selected user is not a courier")

    order = Order(
        product_id=data.product_id,
        courier_id=courier_id,
        quantity=data.quantity,
        sale_price=som_to_tiyins(data.sale_price_som),
        courier_fee=som_to_tiyins(data.courier_fee_som),
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        delivery_address=data.delivery_address,
        note=data.note,
        status="assigned" if courier_id else "new"
    )

    product.stock_quantity -= data.quantity
    db.add(order)
    await db.commit()
    
    # Рефетчим со связями для безопасной сериализации
    statement = (
        select(Order)
        .options(selectinload(Order.product), selectinload(Order.courier))
        .where(Order.id == order.id)
    )
    result = await db.execute(statement)
    order = result.scalar_one()

    _serialize_order(order)
    return order

async def update_order(id: int, data: OrderUpdate, db: AsyncSession, changed_by: User | None = None) -> Order:
    """Обновить заказ."""

    order = await db.get(Order, id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    original_status = order.status
    original_product_id = order.product_id
    original_quantity = order.quantity

    update_data = data.model_dump(exclude_unset=True)

    if "sale_price_som" in update_data:
        update_data["sale_price"] = som_to_tiyins(update_data.pop("sale_price_som"))
    if "courier_fee_som" in update_data:
        update_data["courier_fee"] = som_to_tiyins(update_data.pop("courier_fee_som"))

    new_product_id = update_data.get("product_id", order.product_id)
    new_quantity = update_data.get("quantity", order.quantity)

    if new_product_id != original_product_id or new_quantity != original_quantity:
        current_product = await db.get(Product, original_product_id)
        new_product = await db.get(Product, new_product_id)
        if new_product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

        if current_product is not None:
            current_product.stock_quantity += original_quantity

        if new_product.stock_quantity < new_quantity:
            await db.rollback()
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Insufficient stock")

        new_product.stock_quantity -= new_quantity

    status_updated = "status" in update_data and update_data["status"] != original_status

    for field_name, value in update_data.items():
        setattr(order, field_name, value)

    if status_updated and changed_by is not None:
        await _create_status_log(db, order.id, changed_by.id, original_status, order.status)

    await db.commit()

    # Рефетчим со связями для безопасной сериализации
    statement = (
        select(Order)
        .options(selectinload(Order.product), selectinload(Order.courier))
        .where(Order.id == id)
    )
    result = await db.execute(statement)
    order = result.scalar_one()

    _serialize_order(order)
    return order

async def delete_order(id: int, db: AsyncSession) -> None:
    """Удалить заказ."""

    order = await db.get(Order, id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    product = await db.get(Product, order.product_id)
    if product is not None:
        product.stock_quantity += order.quantity

    await db.delete(order)
    await db.commit()


async def assign_order(id: int, courier_id: UUID, db: AsyncSession, changed_by: User) -> Order:
    """Назначить курьера и перевести заказ в assigned."""

    # Используем select с selectinload для гидратации связей перед передачей в фоновую задачу
    statement = (
        select(Order)
        .options(selectinload(Order.product), selectinload(Order.courier))
        .where(Order.id == id)
    )
    result = await db.execute(statement)
    order = result.scalar_one_or_none()
    
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    courier = await db.get(User, courier_id)
    if courier is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Courier not found")
    if courier.role != "courier":
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Selected user is not a courier")

    original_status = order.status
    order.courier_id = courier_id
    order.status = "assigned"

    if original_status != order.status:
        await _create_status_log(db, order.id, changed_by.id, original_status, order.status)

    await db.commit()
    
    # Рефетчим объект целиком со всеми связями после коммита, чтобы избежать MissingGreenlet при сериализации
    # и гарантировать наличие данных для фоновой задачи.
    statement = (
        select(Order)
        .options(selectinload(Order.product), selectinload(Order.courier))
        .where(Order.id == id)
    )
    result = await db.execute(statement)
    order = result.scalar_one()
    
    _serialize_order(order)
    return order


async def _create_status_log(db: AsyncSession, order_id: int, changed_by: UUID, old_status: str | None, new_status: str) -> None:
    """Сохранить историю изменения статуса."""

    db.add(
        OrderStatusLog(
            order_id=order_id,
            changed_by=changed_by,
            old_status=old_status,
            new_status=new_status,
        )
    )


def _serialize_product(product: Product) -> Product:
    product.purchase_price_som = tiyins_to_som(product.purchase_price)
    return product


def _serialize_order(order: Order) -> Order:
    order.sale_price_som = tiyins_to_som(order.sale_price)
    order.courier_fee_som = tiyins_to_som(order.courier_fee)
    order.net_profit_som = tiyins_to_som((order.sale_price - getattr(order.product, "purchase_price", 0)) * order.quantity - order.courier_fee)
    if order.product is not None:
        order.product = _serialize_product(order.product)
    return order


def _serialize_orders(orders: List[Order]) -> List[Order]:
    for order in orders:
        _serialize_order(order)
    return orders
