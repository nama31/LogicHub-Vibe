"""Хендлеры изменения статуса заказа."""

from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery

from bot.core.http_client import BackendClientError
from bot.services.order_service import BotOrderService


router = Router()


@router.callback_query(F.data.startswith("order_status:"))
async def status_update_handler(callback: CallbackQuery, courier_tg_id: int, order_service: BotOrderService) -> None:
	"""Отправить изменение статуса заказа в backend."""

	if callback.data is None:
		await callback.answer("Некорректная кнопка", show_alert=True)
		return

	_, order_id, new_status = callback.data.split(":", 2)

	try:
		await order_service.update_status(order_id=order_id, tg_id=courier_tg_id, new_status=new_status)
	except BackendClientError as error:
		await callback.answer(f"Не удалось обновить статус: {error.detail}", show_alert=True)
		return

	status_text = {
		"in_transit": "взял в работу",
		"delivered": "доставлен",
		"failed": "помечен как проблемный",
	}.get(new_status, new_status)

	await callback.answer("Статус обновлен")
	if callback.message is not None:
		await callback.message.answer(f"✅ Заказ обновлен: {status_text}.")
