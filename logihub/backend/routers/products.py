"""Роутер товаров."""

from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, require_admin
from schemas.product import ProductOut, ProductCreate, ProductUpdate
from uuid import UUID
from services.product_service import create_product as create_product_service, delete_product as delete_product_service, get_products as get_products_service, update_product as update_product_service

router = APIRouter(prefix="/products", tags=["products"], dependencies=[Depends(require_admin)])

@router.get("", response_model=List[ProductOut])
async def get_products(db: AsyncSession = Depends(get_db)) -> List[ProductOut]:
    """Получение списка товаров (admin)."""

    return await get_products_service(db)

@router.post("", response_model=ProductOut)
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)) -> ProductOut:
    """Создание товара (admin)."""

    return await create_product_service(product, db)

@router.patch("/{id}", response_model=ProductOut)
async def update_product(id: UUID, product: ProductUpdate, db: AsyncSession = Depends(get_db)) -> ProductOut:
    """Обновление товара (admin)."""

    return await update_product_service(id, product, db)

@router.delete("/{id}")
async def delete_product(id: UUID, db: AsyncSession = Depends(get_db)) -> dict:
    """Удаление товара (admin)."""

    await delete_product_service(id, db)
    return {"detail": "deleted"}
