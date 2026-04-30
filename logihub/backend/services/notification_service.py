"""Сервис уведомлений."""

from __future__ import annotations

import asyncio
import logging
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from core.config import settings
from models.order import Order


logger = logging.getLogger(__name__)


async def send_courier_notification(order: Order) -> None:
    """Отправить уведомление курьеру."""

    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token is not configured; skipping courier notification for order %s", order.id)
        return

    tg_id = getattr(order.courier, "tg_id", None)
    if tg_id is None:
        logger.warning("Courier Telegram ID is missing; skipping courier notification for order %s", order.id)
        return

    message = _build_courier_notification(order)
    await asyncio.to_thread(_send_telegram_message, int(tg_id), message)


def _build_courier_notification(order: Order) -> str:
    product_title = getattr(order.product, "title", "Товар")
    customer_name = order.customer_name or "не указано"
    customer_phone = order.customer_phone or "не указано"
    note = order.note or "нет"

    return (
        "Вам назначен новый заказ.\n"
        f"Заказ: {order.id}\n"
        f"Товар: {product_title}\n"
        f"Количество: {order.quantity}\n"
        f"Клиент: {customer_name}\n"
        f"Телефон: {customer_phone}\n"
        f"Адрес: {order.delivery_address}\n"
        f"Комментарий: {note}"
    )


def _send_telegram_message(chat_id: int, text: str) -> None:
    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = urlencode({"chat_id": chat_id, "text": text}).encode("utf-8")
    request = Request(url, data=payload, method="POST")
    request.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urlopen(request, timeout=10) as response:
            response.read()
    except Exception:
        logger.exception("Failed to send Telegram notification to courier %s", chat_id)
