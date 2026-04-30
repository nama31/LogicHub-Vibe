"""Роутер заказов."""

from fastapi import APIRouter, Depends, BackgroundTasks
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, require_admin
from schemas.order import OrderOut, OrderListOut, OrderCreate, OrderUpdate, AssignRequest
from uuid import UUID
from models.user import User
from services.order_service import assign_order as assign_order_service, create_order as create_order_service, delete_order as delete_order_service, get_orders as get_orders_service, update_order as update_order_service
from services.notification_service import send_courier_notification

router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(require_admin)])

@router.get("", response_model=List[OrderListOut])
async def get_orders(db: AsyncSession = Depends(get_db)) -> List[OrderListOut]:
    """Получение списка заказов (admin)."""

    return await get_orders_service(db)

@router.post("", response_model=OrderOut)
async def create_order(order: OrderCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)) -> OrderOut:
    """Создание заказа (admin)."""

    return await create_order_service(order, db, current_user)

@router.patch("/{id}", response_model=OrderOut)
async def update_order(id: UUID, order: OrderUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)) -> OrderOut:
    """Обновление заказа (admin)."""

    return await update_order_service(id, order, db, current_user)

@router.delete("/{id}")
async def delete_order(id: UUID, db: AsyncSession = Depends(get_db)) -> dict:
    """Удаление заказа (admin)."""

    await delete_order_service(id, db)
    return {"detail": "deleted"}

@router.post("/{id}/assign", response_model=OrderOut)
async def assign_order(id: UUID, request: AssignRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)) -> OrderOut:
    """Назначение заказа на курьера (admin)."""

    order = await assign_order_service(id, request.courier_id, db, current_user)
    background_tasks.add_task(send_courier_notification, order)
    return order
