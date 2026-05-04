"""Сервис авторизации курьеров для бота."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from time import monotonic

from bot.core.config import settings
from bot.core.http_client import BackendClient, BackendClientError


@dataclass(slots=True)
class BotAuthService:
	"""Кэш и проверка доступа пользователя по tg_id."""

	client: BackendClient
	cache_ttl_seconds: int = settings.courier_cache_ttl_seconds
	_user_cache: dict[int, dict] = field(default_factory=dict)
	_cached_at: dict[int, float] = field(default_factory=dict)
	_lock: asyncio.Lock = field(default_factory=asyncio.Lock)

	async def get_user(self, tg_id: int) -> dict | None:
		"""Получить данные пользователя из кэша или backend."""

		now = monotonic()
		if tg_id in self._user_cache:
			if (now - self._cached_at[tg_id]) < self.cache_ttl_seconds:
				return self._user_cache[tg_id]

		async with self._lock:
			# Double check after lock
			if tg_id in self._user_cache and (now - self._cached_at[tg_id]) < self.cache_ttl_seconds:
				return self._user_cache[tg_id]

			try:
				user = await self.client.fetch_user_by_tg_id(tg_id)
				if user:
					self._user_cache[tg_id] = user
					self._cached_at[tg_id] = now
					return user
			except Exception:
				pass
			
			return None

	async def refresh(self) -> None:
		"""Очистить кэш (для совместимости с существующим кодом)."""
		self._user_cache.clear()
		self._cached_at.clear()

	async def check_connection(self) -> None:
		"""Проверить соединение с бекендом."""
		await self.client.fetch_courier_tg_ids()
