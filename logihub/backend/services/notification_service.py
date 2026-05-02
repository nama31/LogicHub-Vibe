"""Сервис уведомлений."""

from __future__ import annotations

import asyncio
import logging
import re
from urllib.parse import urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from core.config import settings
from models.order import Order


logger = logging.getLogger(__name__)


def _escape_md2(text: str) -> str:
    """Экранирование спецсимволов для MarkdownV2."""
    special = r"\_*[]()~`>#+-=|{}.!"
    return re.sub(r"([" + re.escape(special) + r"])", r"\\\1", str(text))


async def notify_route_started(route_out) -> None:  # route_out: RouteOut
    """Отправить курьеру уведомление о новом маршруте (MarkdownV2)."""
    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token not configured; skipping route notification")
        return

    courier = route_out.courier
    if courier is None or courier.tg_id is None:
        logger.warning("Route %s courier has no tg_id; skipping notification", route_out.id)
        return

    label = _escape_md2(route_out.label or f"Маршрут #{str(route_out.id)[:8]}")
    stops_total = route_out.stops_total

    text = (
        f"📦 *Новый маршрут назначен*\n\n"
        f"{label} · {_escape_md2(stops_total)} остановок\n"
        f"Нажми кнопку ниже, чтобы начать\\."
    )

    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(
                text="🚀 Начать маршрут",
                callback_data=f"route_start:{route_out.id}",
            )]
        ]
    )

    bot = Bot(token=settings.telegram_bot_token)
    try:
        await bot.send_message(
            chat_id=courier.tg_id,
            text=text,
            reply_markup=keyboard,
            parse_mode="MarkdownV2",
        )
        logger.info("Route assignment notification sent to courier tg_id=%s", courier.tg_id)
    except Exception as exc:
        logger.error("Failed to send route notification: %s", exc, exc_info=True)
    finally:
        await bot.session.close()




def _sanitize_markdown(text: str | None) -> str:
    """Экранирование спецсимволов для Telegram Markdown."""
    if not text:
        return ""
    # В Markdown (v1) нужно экранировать только определенные символы, если они не являются частью разметки.
    # Но проще всего заменять их на безопасные аналоги или использовать MarkdownV2 (где нужно экранировать почти всё).
    # Для простоты и надежности заменим основные проблемные символы.
    return text.replace("_", "\\_").replace("*", "\\*").replace("[", "\\[").replace("`", "\\`")

async def send_courier_notification(order: Order) -> None:
    """Отправить уведомление курьеру с использованием aiogram.Bot."""
    order_id_short = str(order.id)[:8]
    logger.info("Starting async notification pipeline for order %s", order_id_short)

    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token is not configured; skipping notification for order %s", order_id_short)
        return

    bot = Bot(token=settings.telegram_bot_token)
    
    try:
        # Проверка наличия курьера и tg_id
        if not order.courier:
             logger.error("Order %s has no courier assigned; cannot notify", order_id_short)
             return
             
        tg_id_raw = getattr(order.courier, "tg_id", None)
        if tg_id_raw is None:
            logger.warning("Courier %s has no Telegram ID; skipping notification for order %s", order.courier.name, order_id_short)
            return
        
        try:
            tg_id = int(tg_id_raw)
            if tg_id <= 0:
                raise ValueError("Negative or zero ID")
        except (ValueError, TypeError):
            logger.error("Invalid Telegram ID format for courier %s: %s", order.courier.name, tg_id_raw)
            return

        logger.info("Preparing payload for courier %s (TG: %s) for order %s", order.courier.name, tg_id, order_id_short)
        message = _build_courier_notification(order)
        
        # Сборка inline-кнопок через структуру aiogram
        from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
        
        keyboard = InlineKeyboardMarkup(
            inline_keyboard=[
                [InlineKeyboardButton(text="🚀 Взял в работу", callback_data=f"order_status:{order.id}:in_transit")],
                [InlineKeyboardButton(text="✅ Доставлено", callback_data=f"order_status:{order.id}:delivered")],
                [InlineKeyboardButton(text="⚠️ Проблема", callback_data=f"order_status:{order.id}:failed")]
            ]
        )
        
        logger.info("Sending message via aiogram.Bot for order %s", order_id_short)
        await bot.send_message(
            chat_id=tg_id,
            text=message,
            reply_markup=keyboard,
            parse_mode="Markdown"
        )
        logger.info("Notification sent successfully for order %s", order_id_short)

    except Exception as e:
        # aiogram обычно выбрасывает понятные исключения (TelegramBadRequest и т.д.)
        logger.error("Failed to send notification for order %s: %s", order_id_short, str(e), exc_info=True)
    finally:
        # Закрываем сессию бота
        await bot.session.close()


def _build_courier_notification(order: Order) -> str:
    product_title = _sanitize_markdown(getattr(order.product, "title", "Товар"))
    customer_name = _sanitize_markdown(order.customer_name or "не указано")
    customer_phone = _sanitize_markdown(order.customer_phone or "не указано")
    note = _sanitize_markdown(order.note or "нет")
    address = _sanitize_markdown(order.delivery_address or "не указан")

    return (
        "🔔 *Вам назначен новый заказ!*\\n\\n"
        f"📦 *Заказ:* `{str(order.id)[:8]}`\\n"
        f"🍎 *Товар:* {product_title} ({order.quantity} шт.)\\n"
        f"👤 *Клиент:* {customer_name}\\n"
        f"📞 *Телефон:* {customer_phone}\\n"
        f"📍 *Адрес:* {address}\\n"
        f"📝 *Комментарий:* {note}\\n\\n"
        "Нажмите кнопку ниже, чтобы изменить статус."
    )
