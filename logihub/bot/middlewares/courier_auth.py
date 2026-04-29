"""Middleware проверки доступа курьера."""

from __future__ import annotations

from typing import Any, Awaitable, Callable

from aiogram import BaseMiddleware
from aiogram.types import CallbackQuery, Message

from bot.services.auth_service import CourierAuthService


class CourierAuthMiddleware(BaseMiddleware):
	"""Пускает только зарегистрированных курьеров."""

	def __init__(self, auth_service: CourierAuthService) -> None:
		self._auth_service = auth_service

	async def __call__(
		self,
		handler: Callable[[Any, dict[str, Any]], Awaitable[Any]],
		event: Message | CallbackQuery,
		data: dict[str, Any],
	) -> Any:
		user = getattr(event, "from_user", None)
		tg_id = user.id if user is not None else None

		if tg_id is None:
			return await handler(event, data)

		try:
			allowed = await self._auth_service.is_allowed(int(tg_id))
		except Exception:
			allowed = False

		if not allowed:
			await self._deny(event)
			return None

		data["courier_tg_id"] = int(tg_id)
		return await handler(event, data)

	async def _deny(self, event: Message | CallbackQuery) -> None:
		text = "Вы не зарегистрированы. Обратитесь к менеджеру."
		if isinstance(event, CallbackQuery):
			await event.answer(text, show_alert=True)
			if event.message is not None:
				await event.message.answer(text)
			return

		await event.answer(text)
