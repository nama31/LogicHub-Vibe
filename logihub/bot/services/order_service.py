"""Сервис заказов Telegram-бота."""

from __future__ import annotations

from bot.core.http_client import BackendClient


class BotOrderService:
	"""Интеграция бота с backend для смены статусов."""

	def __init__(self, client: BackendClient) -> None:
		self._client = client

	async def update_status(self, order_id: str, tg_id: int, new_status: str) -> dict:
		"""Отправить статус заказа в backend."""

		return await self._client.update_order_status(order_id=order_id, tg_id=tg_id, new_status=new_status)

	async def get_courier_orders(self, tg_id: int, status_filter: str | None = None) -> list[dict]:
		"""Получить список заказов курьера."""

		return await self._client.fetch_courier_orders(tg_id=tg_id, status_filter=status_filter)

