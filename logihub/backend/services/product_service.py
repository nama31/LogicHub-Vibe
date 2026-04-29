"""Сервис товаров."""

from typing import List
from schemas.product import ProductCreate, ProductUpdate
from models.product import Product
from uuid import UUID

async def get_products() -> List[Product]:
    """Получить товары."""
    # TODO: implement
    pass

async def create_product(data: ProductCreate) -> Product:
    """Создать товар."""
    # TODO: implement
    pass

async def update_product(id: UUID, data: ProductUpdate) -> Product:
    """Обновить товар."""
    # TODO: implement
    pass

async def delete_product(id: UUID) -> None:
    """Удалить товар."""
    # TODO: implement
    pass
