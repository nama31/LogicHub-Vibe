"""Роутер для работы с Telegram-ботом."""

from datetime import UTC, datetime
from typing import Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.dependencies import get_db, require_bot_secret
from constants.order_status import STATUS_TRANSITIONS
from models.order import Order
from models.order_status_log import OrderStatusLog
from models.user import User

router = APIRouter(prefix="/bot", tags=["bot"])


class BotStatusUpdateRequest(BaseModel):
    """Запрос от бота на смену статуса заказа."""

    new_status: Literal["in_transit", "delivered", "failed"] = Field(...)
    tg_id: int = Field(..., ge=1)


@router.post("/webhook")
async def bot_webhook(update: dict) -> dict:
    """Вебхук для aiogram."""

    return {"ok": True, "received": bool(update)}


@router.patch("/orders/{id}/status")
async def update_order_status_bot(
    id: UUID,
    payload: BotStatusUpdateRequest,
    db: AsyncSession = Depends(get_db),
    _secret: bool = Depends(require_bot_secret),
) -> dict:
    """Обновление статуса заказа ботом (bot_secret required)."""

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.courier), selectinload(Order.product))
        .where(Order.id == id)
    )
    order = result.scalar_one_or_none()
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.courier is None or order.courier.tg_id != payload.tg_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Courier mismatch")

    allowed_statuses = STATUS_TRANSITIONS.get(order.status, [])
    if payload.new_status not in allowed_statuses:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Invalid status transition")

    courier = await db.scalar(select(User).where(User.tg_id == payload.tg_id))
    if courier is None or not courier.is_active or courier.role != "courier":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Courier not found")

    old_status = order.status
    order.status = payload.new_status

    db.add(
        OrderStatusLog(
            order_id=order.id,
            changed_by=courier.id,
            old_status=old_status,
            new_status=payload.new_status,
            changed_at=datetime.now(UTC),
        )
    )

    await db.commit()
    return {"id": str(order.id), "status": order.status}
