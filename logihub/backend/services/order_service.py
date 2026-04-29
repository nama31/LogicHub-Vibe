"""Сервис заказов."""

from typing import List
from schemas.order import OrderCreate, OrderUpdate
from models.order import Order
from uuid import UUID

async def get_orders() -> List[Order]:
    """Получить заказы."""
    # TODO: implement
    pass

async def create_order(data: OrderCreate) -> Order:
    """Создать заказ."""
    # TODO: implement
    pass

async def update_order(id: UUID, data: OrderUpdate) -> Order:
    """Обновить заказ."""
    # TODO: implement
    pass

async def delete_order(id: UUID) -> None:
    """Удалить заказ."""
    # TODO: implement
    pass
