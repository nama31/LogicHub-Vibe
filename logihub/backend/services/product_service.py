"""Сервис товаров."""

from typing import List
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from constants.price import som_to_tiyins
from schemas.product import ProductCreate, ProductUpdate
from models.product import Product
from models.user import User
from services.serializers import serialize_product_prices
from uuid import UUID

async def get_products(db: AsyncSession, limit: int = 100, offset: int = 0, current_user: User | None = None) -> List[Product]:
    """Получить товары."""

    statement = select(Product).order_by(Product.created_at.desc())
    if current_user and not getattr(current_user, "is_superuser", False):
        statement = statement.where(Product.admin_id == current_user.id)
    
    statement = statement.limit(limit).offset(offset)
    result = await db.execute(statement)
    products = list(result.scalars().all())

    for product in products:
        serialize_product_prices(product)

    return products

async def create_product(data: ProductCreate, db: AsyncSession, current_user: User | None = None) -> Product:
    """Создать товар."""

    product = Product(
        title=data.title,
        purchase_price=som_to_tiyins(data.purchase_price_som),
        selling_price=som_to_tiyins(data.selling_price_som),
        stock_quantity=data.stock_quantity,
        unit=data.unit,
        admin_id=current_user.id if current_user else None
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return serialize_product_prices(product)

async def update_product(id: UUID, data: ProductUpdate, db: AsyncSession, current_user: User | None = None) -> Product:
    """Обновить товар."""

    product = await db.get(Product, id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    if current_user and not getattr(current_user, "is_superuser", False) and product.admin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

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

async def delete_product(id: UUID, db: AsyncSession, current_user: User | None = None) -> None:
    """Удалить товар."""

    product = await db.get(Product, id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    if current_user and not getattr(current_user, "is_superuser", False) and product.admin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    await db.delete(product)
    await db.commit()

async def restock_product(id: UUID, amount: int, db: AsyncSession, current_user: User | None = None) -> Product:
    """Пополнить запасы товара."""
    
    product = await db.get(Product, id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
        
    if current_user and not getattr(current_user, "is_superuser", False) and product.admin_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        
    product.stock_quantity += amount
    await db.commit()
    await db.refresh(product)
    
    serialize_product_prices(product)
    
    from core.websocket import manager
    await manager.broadcast({"event": "product_restocked", "id": str(product.id), "amount": amount})
    
    return product
