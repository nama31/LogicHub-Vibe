"""Роутер заказов."""

from fastapi import APIRouter, Depends
from typing import List
from schemas.order import OrderOut, OrderListOut, OrderCreate, OrderUpdate, AssignRequest
from uuid import UUID

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("", response_model=List[OrderListOut])
async def get_orders() -> List[OrderListOut]:
    """Получение списка заказов (admin)."""
    # TODO: implement
    pass

@router.post("", response_model=OrderOut)
async def create_order(order: OrderCreate) -> OrderOut:
    """Создание заказа (admin)."""
    # TODO: implement
    pass

@router.patch("/{id}", response_model=OrderOut)
async def update_order(id: UUID, order: OrderUpdate) -> OrderOut:
    """Обновление заказа (admin)."""
    # TODO: implement
    pass

@router.delete("/{id}")
async def delete_order(id: UUID) -> dict:
    """Удаление заказа (admin)."""
    # TODO: implement
    pass

@router.post("/{id}/assign", response_model=OrderOut)
async def assign_order(id: UUID, request: AssignRequest) -> OrderOut:
    """Назначение заказа на курьера (admin)."""
    # TODO: implement
    pass
