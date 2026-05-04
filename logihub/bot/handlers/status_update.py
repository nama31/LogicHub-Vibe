"""Хендлеры изменения статуса заказа."""

from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from bot.core.http_client import BackendClientError
from bot.services.order_service import BotOrderService


class ProblemReportState(StatesGroup):
	waiting_for_reason = State()


router = Router()


@router.callback_query(F.data.startswith("order_status:"))
async def status_update_handler(callback: CallbackQuery, tg_id: int, order_service: BotOrderService, state: FSMContext) -> None:
	"""Отправить изменение статуса заказа в backend."""

	if callback.data is None:
		await callback.answer("Некорректная кнопка", show_alert=True)
		return

	_, order_id, new_status = callback.data.split(":", 2)

	if new_status == "failed":
		await state.update_data(order_id=order_id)
		await state.set_state(ProblemReportState.waiting_for_reason)
		if callback.message is not None:
			await callback.message.answer("Пожалуйста, опишите причину проблемы с заказом:")
		await callback.answer()
		return

	try:
		await order_service.update_status(order_id=order_id, tg_id=tg_id, new_status=new_status)
	except BackendClientError as error:
		await callback.answer(f"Не удалось обновить статус: {error.detail}", show_alert=True)
		return

	status_text = {
		"in_transit": "взял в работу",
		"delivered": "доставлен",
	}.get(new_status, new_status)

	await callback.answer("Статус обновлен")
	if callback.message is not None:
		await callback.message.answer(f"✅ Заказ обновлен: {status_text}.")


@router.message(ProblemReportState.waiting_for_reason)
async def process_problem_reason(message: Message, state: FSMContext, tg_id: int, order_service: BotOrderService) -> None:
	"""Обработать текст причины проблемы."""

	data = await state.get_data()
	order_id = data.get("order_id")
	reason = message.text

	if not order_id or not reason:
		await message.answer("Ошибка: данные заказа не найдены или пустая причина.")
		await state.clear()
		return

	try:
		await order_service.update_status(order_id=order_id, tg_id=tg_id, new_status="failed", reason=reason)
	except BackendClientError as error:
		await message.answer(f"Не удалось обновить статус: {error.detail}")
		await state.clear()
		return

	await message.answer("✅ Заказ помечен как проблемный. Причина сохранена.")
	await state.clear()
