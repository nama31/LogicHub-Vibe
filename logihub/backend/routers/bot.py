"""Роутер для работы с Telegram-ботом."""

from fastapi import APIRouter, Depends
from uuid import UUID

router = APIRouter(prefix="/bot", tags=["bot"])

@router.post("/webhook")
async def bot_webhook(update: dict) -> dict:
    """Вебхук для aiogram."""
    # TODO: implement
    pass

@router.patch("/orders/{id}/status")
async def update_order_status_bot(id: UUID, status: str) -> dict:
    """Обновление статуса заказа ботом (bot_secret required)."""
    # TODO: implement
    pass
