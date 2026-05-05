"""Middleware проверки роли пользователя."""

from __future__ import annotations

from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message

from bot.services.auth_service import BotAuthService
from bot.utils.formatters import format_warning_message


class RoleAuthMiddleware(BaseMiddleware):
	"""Определяет роль пользователя и прикрепляет к данным."""

	def __init__(self, auth_service: BotAuthService) -> None:
		self._auth_service = auth_service

	async def __call__(
		self,
		handler: Callable[[Any, dict[str, Any]], Awaitable[Any]],
		event: Message | CallbackQuery,
		data: dict[str, Any],
	) -> Any:
		user_tg = getattr(event, "from_user", None)
		tg_id = user_tg.id if user_tg is not None else None

		if tg_id is None:
			return await handler(event, data)

		user_db = await self._auth_service.get_user(int(tg_id))

		if user_db is None or not user_db.get("is_active"):
			# Разрешаем /start для всех (хендлер сам покажет сообщение об ошибке если нет пользователя)
			if isinstance(event, Message) and event.text == "/start":
				data["user_role"] = None
				return await handler(event, data)
				
			await self._deny(event)
			return None

		data["user_role"] = user_db.get("role")
		data["user_name"] = user_db.get("name")
		data["tg_id"] = int(tg_id)
		
		return await handler(event, data)

	async def _deny(self, event: Message | CallbackQuery) -> None:
		message_text = format_warning_message(
			"Аккаунт не найден. Пожалуйста, обратитесь к менеджеру для регистрации.",
			"Доступ ограничен",
		)
		if isinstance(event, CallbackQuery):
			await event.answer("Аккаунт не найден. Обратитесь к менеджеру для регистрации.", show_alert=True)
			if event.message is not None:
				await event.message.answer(message_text)
			return

		await event.answer(message_text)
