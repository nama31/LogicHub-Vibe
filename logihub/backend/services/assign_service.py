"""Сервис назначения заказов."""

from uuid import UUID
from models.order import Order

async def assign_courier(order_id: UUID, courier_id: UUID) -> Order:
    """Назначить курьера на заказ."""
    # TODO: implement
    pass
