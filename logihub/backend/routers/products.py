"""Роутер товаров."""

from fastapi import APIRouter, Depends
from typing import List
from schemas.product import ProductOut, ProductCreate, ProductUpdate
from uuid import UUID

router = APIRouter(prefix="/products", tags=["products"])

@router.get("", response_model=List[ProductOut])
async def get_products() -> List[ProductOut]:
    """Получение списка товаров (admin)."""
    # TODO: implement
    pass

@router.post("", response_model=ProductOut)
async def create_product(product: ProductCreate) -> ProductOut:
    """Создание товара (admin)."""
    # TODO: implement
    pass

@router.patch("/{id}", response_model=ProductOut)
async def update_product(id: UUID, product: ProductUpdate) -> ProductOut:
    """Обновление товара (admin)."""
    # TODO: implement
    pass

@router.delete("/{id}")
async def delete_product(id: UUID) -> dict:
    """Удаление товара (admin)."""
    # TODO: implement
    pass
