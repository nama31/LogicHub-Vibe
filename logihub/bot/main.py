"""Точка входа Telegram-бота."""

from __future__ import annotations

import asyncio

from aiogram import Bot, Dispatcher

from bot.core.config import settings
from bot.core.http_client import BackendClient
from bot.handlers.help import router as help_router
from bot.handlers.my_orders import router as my_orders_router
from bot.handlers.new_orders import router as new_orders_router
from bot.handlers.registration import router as registration_router
from bot.handlers.routes import router as routes_router
from bot.handlers.start import router as start_router
from bot.handlers.status_update import router as status_router
from bot.handlers.client_order import router as client_order_router
from bot.middlewares.role_auth import RoleAuthMiddleware
from bot.services.auth_service import BotAuthService
from bot.services.order_service import BotOrderService


async def main() -> None:
	"""Запустить бота в polling-режиме."""

	if not settings.telegram_bot_token:
		raise RuntimeError("TELEGRAM_BOT_TOKEN is required to start the bot")
	if not settings.bot_secret:
		raise RuntimeError("BOT_SECRET is required to start the bot")

	backend_client = BackendClient()
	auth_service = BotAuthService(backend_client)
	order_service = BotOrderService(backend_client)

	bot = Bot(token=settings.telegram_bot_token)
	dp = Dispatcher()

	dp["order_service"] = order_service
	dp["auth_service"] = auth_service
	dp["backend_client"] = backend_client  # Available to route handlers

	middleware = RoleAuthMiddleware(auth_service)
	dp.message.middleware(middleware)
	dp.callback_query.middleware(middleware)

	dp.include_router(start_router)
	dp.include_router(registration_router)
	dp.include_router(help_router)
	dp.include_router(routes_router)
	dp.include_router(my_orders_router)
	dp.include_router(new_orders_router)
	dp.include_router(status_router)
	dp.include_router(client_order_router)

	# Резильентный запуск: ждем бекенд
	max_retries = 10
	for i in range(max_retries):
		try:
			await auth_service.check_connection()
			print("✅ Бот успешно подключен к бекенду")
			break
		except Exception as e:
			if i == max_retries - 1:
				print(f"❌ Не удалось подключиться к бекенду после {max_retries} попыток")
				raise
			print(f"⚠️ Ожидание бекенда... (попытка {i+1}/{max_retries})")
			await asyncio.sleep(3)

	try:
		await bot.delete_webhook(drop_pending_updates=True)
		await dp.start_polling(bot)
	finally:
		await backend_client.close()
		await bot.session.close()


if __name__ == "__main__":
	asyncio.run(main())
