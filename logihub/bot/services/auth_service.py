"""Сервис авторизации курьеров для бота."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from time import monotonic

from bot.core.config import settings
from bot.core.http_client import BackendClient, BackendClientError


@dataclass(slots=True)
class CourierAuthService:
	"""Кэш и проверка доступа курьера по tg_id."""

	client: BackendClient
	cache_ttl_seconds: int = settings.courier_cache_ttl_seconds
	_allowed_tg_ids: set[int] = field(default_factory=set)
	_cached_at: float = 0.0
	_lock: asyncio.Lock = field(default_factory=asyncio.Lock)

	async def refresh(self) -> set[int]:
		"""Обновить кэш курьеров из backend."""

		async with self._lock:
			try:
				allowed_ids = await self.client.fetch_courier_tg_ids()
			except BackendClientError:
				if not self._allowed_tg_ids:
					raise
				return self._allowed_tg_ids

			self._allowed_tg_ids = allowed_ids
			self._cached_at = monotonic()
			return self._allowed_tg_ids

	async def is_allowed(self, tg_id: int) -> bool:
		"""Проверить, зарегистрирован ли курьер."""

		if not self._allowed_tg_ids or (monotonic() - self._cached_at) > self.cache_ttl_seconds:
			await self.refresh()

		return tg_id in self._allowed_tg_ids
