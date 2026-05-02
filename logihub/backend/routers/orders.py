"""Роутер заказов."""

from fastapi import APIRouter, Depends, BackgroundTasks
from typing import List
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_db, require_admin
from schemas.order import OrderOut, OrderListOut, OrderCreate, OrderUpdate, AssignRequest, StatusEntryOut
from uuid import UUID
from models.user import User
from services.order_service import assign_order as assign_order_service, create_order as create_order_service, delete_order as delete_order_service, get_orders as get_orders_service, update_order as update_order_service, get_order_by_id as get_order_by_id_service, get_order_timeline as get_order_timeline_service
from services.notification_service import send_courier_notification

router = APIRouter(prefix="/orders", tags=["orders"], dependencies=[Depends(require_admin)])

@router.get("", response_model=List[OrderListOut])
async def get_orders(
    status: str | None = None,
    courier_id: UUID | None = None,
    db: AsyncSession = Depends(get_db)
) -> List[OrderListOut]:
    """Получение списка заказов (admin)."""

    return await get_orders_service(db, status=status, courier_id=courier_id)

from fastapi.responses import StreamingResponse
from services.order_service import export_orders_csv

@router.get("/export")
async def export_orders(
    status: str | None = None,
    courier_id: UUID | None = None,
    db: AsyncSession = Depends(get_db)
):
    """Экспорт списка заказов в CSV (admin)."""
    csv_data = await export_orders_csv(db, status=status, courier_id=courier_id)
    
    response = StreamingResponse(iter([csv_data]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=orders_export.csv"
    return response

@router.get("/{id}", response_model=OrderOut)
async def get_order_by_id(id: int, db: AsyncSession = Depends(get_db)) -> OrderOut:
    """Получение заказа по ID (admin)."""

    return await get_order_by_id_service(id, db)

@router.get("/{id}/timeline", response_model=List[StatusEntryOut])
async def get_order_timeline(id: int, db: AsyncSession = Depends(get_db)) -> List[StatusEntryOut]:
    """Получение истории статусов заказа (admin)."""

    return await get_order_timeline_service(id, db)

@router.post("", response_model=OrderOut)
async def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)) -> OrderOut:
    """Создание заказа (admin)."""

    order = await create_order_service(order_data, db, current_user)
    if order.courier_id:
        background_tasks.add_task(send_courier_notification, order)
    return order

@router.patch("/{id}", response_model=OrderOut)
async def update_order(id: int, order_data: OrderUpdate, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)) -> OrderOut:
    """Обновление заказа (admin)."""

    order = await update_order_service(id, order_data, db, current_user)
    # Если статус изменился на assigned или изменился курьер
    if order.status == "assigned":
        background_tasks.add_task(send_courier_notification, order)
    return order

@router.delete("/{id}")
async def delete_order(id: int, db: AsyncSession = Depends(get_db)) -> dict:
    """Удаление заказа (admin)."""

    await delete_order_service(id, db)
    return {"detail": "deleted"}

@router.post("/{id}/assign", response_model=OrderOut)
async def assign_order(id: int, request: AssignRequest, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_db), current_user: User = Depends(require_admin)) -> OrderOut:
    """Назначение заказа на курьера (admin)."""

    order = await assign_order_service(id, request.courier_id, db, current_user)
    background_tasks.add_task(send_courier_notification, order)
    return order
