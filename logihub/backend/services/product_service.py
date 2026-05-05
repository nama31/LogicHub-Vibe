"""Сервис товаров."""

from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.price import som_to_tiyins
from schemas.product import ProductCreate, ProductUpdate
from models.product import Product
from services.serializers import serialize_product_prices
from uuid import UUID

async def get_products(db: AsyncSession) -> List[Product]:
    """Получить товары."""

    result = await db.execute(select(Product).order_by(Product.created_at.desc()))
    products = list(result.scalars().all())

    for product in products:
        serialize_product_prices(product)

    return products

async def create_product(data: ProductCreate, db: AsyncSession) -> Product:
    """Создать товар."""

    product = Product(
        title=data.title,
        purchase_price=som_to_tiyins(data.purchase_price_som),
        selling_price=som_to_tiyins(data.selling_price_som),
        stock_quantity=data.stock_quantity,
        unit=data.unit,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return serialize_product_prices(product)

async def update_product(id: UUID, data: ProductUpdate, db: AsyncSession) -> Product:
    """Обновить товар."""

    product = await db.get(Product, id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)

    if "purchase_price_som" in update_data:
        update_data["purchase_price"] = som_to_tiyins(update_data.pop("purchase_price_som"))
    if "selling_price_som" in update_data:
        update_data["selling_price"] = som_to_tiyins(update_data.pop("selling_price_som"))

    for field_name, value in update_data.items():
        setattr(product, field_name, value)

    await db.commit()
    await db.refresh(product)
    return serialize_product_prices(product)

async def delete_product(id: UUID, db: AsyncSession) -> None:
    """Удалить товар."""

    product = await db.get(Product, id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    await db.delete(product)
    await db.commit()

async def restock_product(id: UUID, amount: int, db: AsyncSession) -> Product:
    """Пополнить запасы товара."""
    
    product = await db.get(Product, id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    product.stock_quantity += amount
    await db.commit()
    await db.refresh(product)
    
    serialize_product_prices(product)
    
    from core.websocket import manager
    await manager.broadcast({"event": "product_restocked", "id": str(product.id), "amount": amount})
    
    return product
