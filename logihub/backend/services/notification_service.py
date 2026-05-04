"""Сервис уведомлений."""

from __future__ import annotations

import asyncio
import html
import logging
import re
from urllib.parse import urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen

import httpx

from aiogram import Bot
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup
from sqlalchemy.orm import selectinload
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




def _sanitize_html(text: str | None) -> str:
    """Экранирование спецсимволов для Telegram HTML."""
    if not text:
        return ""
    return html.escape(str(text))

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
            parse_mode="HTML"
        )
        logger.info("Notification sent successfully for order %s", order_id_short)

    except Exception as e:
        # aiogram обычно выбрасывает понятные исключения (TelegramBadRequest и т.д.)
        logger.error("Failed to send notification for order %s: %s", order_id_short, str(e), exc_info=True)
    finally:
        # Закрываем сессию бота
        await bot.session.close()


def _build_courier_notification(order: Order) -> str:
    product_title = _sanitize_html(getattr(order.product, "title", "Товар"))
    customer_name = _sanitize_html(order.customer_name or "не указано")
    customer_phone = _sanitize_html(order.customer_phone or "не указано")
    note = _sanitize_html(order.note or "нет")
    address = _sanitize_html(order.delivery_address or "не указан")

    return (
        "📦 <b>Вам назначен новый заказ!</b>\n\n"
        f"🆔 <b>Заказ:</b> #{str(order.id)[:8]}\n"
        f"🛒 <b>Товар:</b> {product_title} ({order.quantity} шт.)\n"
        f"👤 <b>Клиент:</b> {customer_name}\n"
        f"📞 <b>Телефон:</b> {customer_phone}\n"
        f"📍 <b>Адрес:</b> {address}\n"
        f"📝 <b>Комментарий:</b> {note}\n\n"
        "👇 <i>Нажмите кнопку ниже, чтобы изменить статус.</i>"
    )


async def notify_customer_order_dispatched(
    order: Order, 
    courier, 
    product, 
    customer_tg_id: int | None = None
) -> None:
    """Уведомить клиента (Telegram и/или WhatsApp) о том, что заказ в пути."""
    
    order_id_short = str(order.id)[:8]
    customer_name = order.customer_name or "уважаемый клиент"
    product_title = getattr(product, "title", "товар")
    courier_name = getattr(courier, "name", "курьер")
    courier_phone = getattr(courier, "phone", "не указан")

    message = (
        f"🚚 <b>Ваш заказ в пути!</b>\n\n"
        f"🛒 <b>Товар:</b> {product_title}\n"
        f"👤 <b>Курьер:</b> {courier_name}\n"
        f"📞 <b>Телефон курьера:</b> {courier_phone}\n\n"
        "Ожидайте доставку в ближайшее время!"
    )

    # 1. Telegram notification (if tg_id is known)
    if customer_tg_id and settings.telegram_bot_token:
        bot = Bot(token=settings.telegram_bot_token)
        try:
            await bot.send_message(
                chat_id=customer_tg_id,
                text=message,
                parse_mode="HTML"
            )
            logger.info("✅ Telegram dispatch notification sent to customer %s", customer_tg_id)
        except Exception as e:
            logger.error("❌ Failed to send Telegram notification to customer %s: %s", customer_tg_id, e)
        finally:
            await bot.session.close()

    # 2. WhatsApp notification (legacy/backup)
    if order.customer_phone and settings.whatsapp_api_url and settings.whatsapp_api_token:
        wa_message = (
            f"Здравствуйте, {customer_name}! Ваш заказ ({product_title}) в пути. "
            f"Курьер: {courier_name}, Телефон: {courier_phone}. Ожидайте доставку!"
        )
        payload = {
            "phone": order.customer_phone,
            "text": wa_message
        }
        headers = {
            "Authorization": f"Bearer {settings.whatsapp_api_token}",
            "Content-Type": "application/json"
        }
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    settings.whatsapp_api_url,
                    json=payload,
                    headers=headers,
                    timeout=10.0
                )
                response.raise_for_status()
                logger.info(f"✅ WhatsApp message successfully sent to {order.customer_phone}.")
        except Exception as e:
            logger.error(f"❌ Failed to send WhatsApp to {order.customer_phone}: {str(e)}")
    elif not customer_tg_id:
        logger.warning("Order %s has no customer_phone and no customer_tg_id; no notification sent", order_id_short)


async def notify_admin_new_client_order(client_name: str, order_id: int, admin_tg_id: int) -> None:
    """Уведомить администратора о новом заказе от клиента."""
    if not settings.telegram_bot_token:
        logger.warning("Telegram bot token not configured; skipping admin notification")
        return

    message = f"🔔 <b>Новый заказ от клиента {client_name}!</b>\n\n🆔 <b>Заказ:</b> #{order_id}"

    bot = Bot(token=settings.telegram_bot_token)
    try:
        await bot.send_message(
            chat_id=admin_tg_id,
            text=message,
            parse_mode="HTML"
        )
        logger.info("Admin notification sent for order %s", order_id)
    except Exception as exc:
        logger.error("Failed to send admin notification: %s", exc, exc_info=True)
    finally:
        await bot.session.close()


async def notify_client_dispatch(order_id: int, courier_name: str, courier_phone: str, db: AsyncSession) -> None:
    """Хелпер для уведомления клиента при переходе заказа в in_transit (для маршрутов)."""
    from sqlalchemy import select
    from models.order import Order
    from models.user import User

    # Fetch order and product
    stmt = select(Order).options(selectinload(Order.product)).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one_or_none()
    if not order:
        return

    # Find client tg_id
    customer_tg_id = None
    if order.customer_phone:
        client_user = await db.scalar(
            select(User).where(User.phone == order.customer_phone, User.role == "client")
        )
        customer_tg_id = client_user.tg_id if client_user else None

    # Dummy courier object for compatibility
    class MockCourier:
        def __init__(self, name, phone):
            self.name = name
            self.phone = phone

    await notify_customer_order_dispatched(
        order, 
        MockCourier(courier_name, courier_phone), 
        order.product, 
        customer_tg_id
    )
