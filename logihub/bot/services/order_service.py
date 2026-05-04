"""Сервис заказов Telegram-бота."""

from __future__ import annotations

from bot.core.config import settings
from bot.core.http_client import BackendClient


class BotOrderService:
	"""Интеграция бота с backend для смены статусов."""

	def __init__(self, client: BackendClient) -> None:
		self._client = client

	async def update_status(self, order_id: str, tg_id: int, new_status: str, reason: str | None = None) -> dict:
		"""Отправить статус заказа в backend."""

		return await self._client.update_order_status(order_id=order_id, tg_id=tg_id, new_status=new_status, reason=reason)

	async def get_courier_orders(self, tg_id: int, status_filter: str | None = None) -> list[dict]:
		"""Получить список заказов курьера."""

		return await self._client.fetch_courier_orders(tg_id=tg_id, status_filter=status_filter)

	async def get_catalog(self, tg_id: int) -> list[dict]:
		"""Получить каталог товаров."""

		return await self._client.request(
			"GET",
			"/bot/catalog",
			headers={"X-Bot-Secret": settings.bot_secret},
			query={"tg_id": tg_id},
		)

	async def create_client_order(
		self, 
		tg_id: int, 
		product_id: str, 
		quantity: int, 
		delivery_address: str, 
		note: str | None = None
	) -> dict:
		"""Создать заказ клиента."""

		return await self._client.request(
			"POST",
			"/bot/orders/client",
			headers={"X-Bot-Secret": settings.bot_secret},
			json_body={
				"tg_id": tg_id,
				"product_id": product_id,
				"quantity": quantity,
				"delivery_address": delivery_address,
				"note": note,
			},
		)

	async def create_batch_order(
		self, 
		tg_id: int, 
		items: list[dict], 
		delivery_address: str, 
		note: str | None = None
	) -> dict:
		"""Создать пакетный заказ клиента (корзина)."""

		return await self._client.request(
			"POST",
			"/bot/orders/client/batch",
			headers={"X-Bot-Secret": settings.bot_secret},
			json_body={
				"tg_id": tg_id,
				"items": items,
				"delivery_address": delivery_address,
				"note": note,
			},
		)

	async def get_user_orders(self, tg_id: int) -> list[dict]:
		"""Получить список всех заказов пользователя (для клиента)."""

		# Мы можем переиспользовать fetch_courier_orders если бекенд умеет возвращать заказы для tg_id вне зависимости от роли
		# Но в BackendClient.fetch_courier_orders фильтруется по курьеру.
		# Нам нужен новый метод в BackendClient или обновить существующий.
		return await self._client.request(
			"GET",
			"/bot/orders",
			headers={"X-Bot-Secret": settings.bot_secret},
			query={"tg_id": tg_id},
		)

