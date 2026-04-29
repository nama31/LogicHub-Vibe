"""Точка входа Telegram-бота."""

from __future__ import annotations

import asyncio

from aiogram import Bot, Dispatcher

from bot.core.config import settings
from bot.core.http_client import BackendClient
from bot.handlers.help import router as help_router
from bot.handlers.my_orders import router as my_orders_router
from bot.handlers.new_orders import router as new_orders_router
from bot.handlers.start import router as start_router
from bot.handlers.status_update import router as status_router
from bot.middlewares.courier_auth import CourierAuthMiddleware
from bot.services.auth_service import CourierAuthService
from bot.services.order_service import BotOrderService


async def main() -> None:
	"""Запустить бота в polling-режиме."""

	if not settings.telegram_bot_token:
		raise RuntimeError("TELEGRAM_BOT_TOKEN is required to start the bot")
	if not settings.bot_secret:
		raise RuntimeError("BOT_SECRET is required to start the bot")

	backend_client = BackendClient()
	auth_service = CourierAuthService(backend_client)
	order_service = BotOrderService(backend_client)

	bot = Bot(token=settings.telegram_bot_token)
	dp = Dispatcher()

	dp["order_service"] = order_service

	middleware = CourierAuthMiddleware(auth_service)
	dp.message.middleware(middleware)
	dp.callback_query.middleware(middleware)

	dp.include_router(start_router)
	dp.include_router(help_router)
	dp.include_router(my_orders_router)
	dp.include_router(new_orders_router)
	dp.include_router(status_router)

	try:
		await auth_service.refresh()
		await dp.start_polling(bot)
	finally:
		await backend_client.close()
		await bot.session.close()


if __name__ == "__main__":
	asyncio.run(main())
