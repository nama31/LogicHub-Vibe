"""Роутер для работы с Telegram-ботом."""

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.dependencies import get_db, require_bot_secret
from core.websocket import manager
from constants.order_status import STATUS_TRANSITIONS
from models.order import Order
from models.order_status_log import OrderStatusLog
from models.user import User

from models.product import Product
from models.route import Route
from services.bot_lookup_service import (
    get_active_client_by_tg_id,
    get_active_courier_by_tg_id,
    get_client_tg_id_by_phone,
    get_first_admin_with_tg_id,
)
from services.notification_service import notify_admin_new_client_order

router = APIRouter(prefix="/bot", tags=["bot"])


class BotStatusUpdateRequest(BaseModel):
    """Запрос от бота на смену статуса заказа."""

    new_status: Literal["in_transit", "delivered", "failed"] = Field(...)
    tg_id: int = Field(..., ge=1)
    reason: str | None = None


class BotRegisterRequest(BaseModel):
    """Запрос на регистрацию курьера через бот."""

    phone: str = Field(..., min_length=5)
    tg_id: int = Field(..., ge=1)


class ClientBatchItem(BaseModel):
    """Элемент заказа в корзине."""

    product_id: UUID = Field(...)
    quantity: int = Field(..., ge=1)


class BotClientBatchOrderRequest(BaseModel):
    """Запрос на создание нескольких заказов (корзина)."""

    tg_id: int = Field(..., ge=1)
    items: list[ClientBatchItem] = Field(..., min_length=1)
    delivery_address: str = Field(..., min_length=1)
    note: str | None = None


class BotClientOrderRequest(BaseModel):
    """Запрос на создание заказа клиентом."""

    tg_id: int = Field(..., ge=1)
    product_id: UUID = Field(...)
    quantity: int = Field(..., ge=1)
    delivery_address: str = Field(..., min_length=1)
    note: str | None = None


@router.post("/register")
async def register_bot_user(
    payload: BotRegisterRequest,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> dict:
    """Регистрация пользователя (курьера или клиента) по номеру телефона."""

    from services.user_service import get_user_by_phone
    
    user = await get_user_by_phone(payload.phone, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User with this phone not found")
    
    if user.role not in ["courier", "client"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied for this role")

    user.tg_id = payload.tg_id
    user.is_active = True
    
    await db.commit()
    return {"status": "ok", "user_id": str(user.id)}


@router.get("/users/{tg_id}")
async def get_bot_user(
    tg_id: int,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> dict:
    """Получение данных пользователя по tg_id."""

    user = await db.scalar(select(User).where(User.tg_id == tg_id))
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    
    return {
        "id": user.id,
        "name": user.name,
        "role": user.role,
        "is_active": user.is_active,
    }


@router.get("/catalog")
async def get_bot_catalog(
    tg_id: int,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> list:
    """Получение каталога товаров (для клиентов)."""

    user = await db.scalar(select(User).where(User.tg_id == tg_id))
    if user is None or not user.is_active or user.role != "client":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client access required")

    result = await db.execute(
        select(Product)
        .where(Product.stock_quantity > 0)
        .order_by(Product.title.asc())
    )
    products = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "title": p.title,
            "unit": p.unit,
            "stock_quantity": p.stock_quantity,
        }
        for p in products
    ]


@router.post("/orders/client")
async def create_client_order_bot(
    payload: BotClientOrderRequest,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> dict:
    """Создание заказа клиентом через бот."""

    user = await get_active_client_by_tg_id(payload.tg_id, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client access required")

    product = await db.get(Product, payload.product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    if product.stock_quantity < payload.quantity:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Insufficient stock")

    order = Order(
        product_id=payload.product_id,
        quantity=payload.quantity,
        sale_price=product.selling_price,
        courier_fee=0, # Заполняется админом позже
        customer_name=user.name,
        customer_phone=user.phone,
        delivery_address=payload.delivery_address,
        note=payload.note,
        status="pending"
    )
    
    product.stock_quantity -= payload.quantity
    db.add(order)
    await db.flush() # Получаем ID заказа

    # Лог статуса
    db.add(
        OrderStatusLog(
            order_id=order.id,
            changed_by=user.id,
            old_status=None,
            new_status="new",
            changed_at=datetime.now(UTC),
        )
    )

    await db.commit()

    # Уведомление админа
    admin = await get_first_admin_with_tg_id(db)
    if admin:
        import asyncio
        asyncio.create_task(notify_admin_new_client_order(user.name, order.id, admin.tg_id))

    await manager.broadcast({"event": "order_created", "id": order.id})

    return {"status": "ok", "order_id": order.id}


@router.post("/orders/client/batch")
async def create_client_batch_orders_bot(
    payload: BotClientBatchOrderRequest,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> dict:
    """Создание нескольких заказов (корзина) клиентом через бот."""

    user = await get_active_client_by_tg_id(payload.tg_id, db)
    if user is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Client access required")

    # 1. Создаем маршрут (черновик на проверке)
    route = Route(
        courier_id=None,
        created_by=user.id,
        label=f"Заказ: {user.name}",
        status="pending"
    )
    db.add(route)
    await db.flush()

    created_orders = []
    
    for idx, item in enumerate(payload.items, 1):
        product = await db.get(Product, item.product_id)
        if product is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Product {item.product_id} not found")

        if product.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, 
                detail=f"Insufficient stock for {product.title}"
            )

        order = Order(
            product_id=item.product_id,
            quantity=item.quantity,
            sale_price=product.selling_price,
            courier_fee=0,
            customer_name=user.name,
            customer_phone=user.phone,
            delivery_address=payload.delivery_address,
            note=payload.note,
            status="pending",
            route_id=route.id,
            stop_sequence=idx
        )
        
        product.stock_quantity -= item.quantity
        db.add(order)
        created_orders.append(order)

    await db.flush() # Получаем ID всех заказов

    for order in created_orders:
        db.add(
            OrderStatusLog(
                order_id=order.id,
                changed_by=user.id,
                old_status=None,
                new_status="pending",
                changed_at=datetime.now(UTC),
            )
        )
        await manager.broadcast({"event": "order_created", "id": order.id})

    await manager.broadcast({"event": "route_created", "id": str(route.id)})

    await db.commit()

    # Уведомление админа (один раз на всю пачку)
    admin = await get_first_admin_with_tg_id(db)
    if admin:
        import asyncio
        asyncio.create_task(notify_admin_new_client_order(user.name, f"пачки ({len(created_orders)} поз.)", admin.tg_id))

    return {"status": "ok", "order_ids": [o.id for o in created_orders]}


@router.post("/webhook")
async def bot_webhook(update: dict) -> dict:
    """Вебхук для aiogram."""

    return {"ok": True, "received": bool(update)}


@router.get("/orders")
async def get_courier_orders_bot(
    tg_id: int,
    status: str | None = None,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> list:
    """Получение списка заказов для конкретного курьера (bot_secret required)."""

    statement = (
        select(Order)
        .join(User, User.id == Order.courier_id)
        .options(selectinload(Order.product))
        .where(User.tg_id == tg_id)
    )
    if status:
        statement = statement.where(Order.status == status)
    else:
        # По умолчанию возвращаем только активные
        statement = statement.where(Order.status.in_(["assigned", "in_transit"]))

    statement = statement.order_by(Order.created_at.desc())
    
    result = await db.execute(statement)
    orders = result.scalars().all()
    
    return [
        {
            "id": o.id,
            "product_title": o.product.title if o.product else "Товар",
            "quantity": o.quantity,
            "status": o.status,
            "delivery_address": o.delivery_address,
            "customer_name": o.customer_name,
            "customer_phone": o.customer_phone,
            "note": o.note,
        }
        for o in orders
    ]


@router.patch("/orders/{id}/status")
async def update_order_status_bot(
    id: int,
    payload: BotStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> dict:
    """Обновление статуса заказа ботом (bot_secret required)."""

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.courier), selectinload(Order.product))
        .where(Order.id == id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.courier is None or order.courier.tg_id != payload.tg_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Courier mismatch")

    allowed_statuses = STATUS_TRANSITIONS.get(order.status, [])
    if payload.new_status not in allowed_statuses:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status transition")

    courier = await get_active_courier_by_tg_id(payload.tg_id, db)
    if courier is None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Courier not found")

    old_status = order.status
    order.status = payload.new_status

    if payload.new_status == "failed" and payload.reason:
        reason_text = f"Courier Report: {payload.reason}"
        if order.note:
            order.note = f"{order.note}\n{reason_text}"
        else:
            order.note = reason_text

    db.add(
        OrderStatusLog(
            order_id=order.id,
            changed_by=courier.id,
            old_status=old_status,
            new_status=payload.new_status,
            changed_at=datetime.now(UTC),
        )
    )

    await db.commit()

    if payload.new_status == "in_transit" and order.customer_phone:
        import asyncio
        from services.notification_service import notify_customer_order_dispatched
        
        customer_tg_id = await get_client_tg_id_by_phone(order.customer_phone, db)
        asyncio.create_task(notify_customer_order_dispatched(order, courier, order.product, customer_tg_id))

    await manager.broadcast({
        "event": "order_updated",
        "order_id": order.id,
        "new_status": payload.new_status
    })

    return {"id": order.id, "status": order.status}
