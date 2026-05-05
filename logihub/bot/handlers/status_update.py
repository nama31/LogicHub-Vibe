"""Хендлеры изменения статуса заказа."""

from __future__ import annotations

from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup

from bot.core.http_client import BackendClientError
from bot.services.order_service import BotOrderService
from bot.utils.formatters import format_error_message, format_success_message, format_warning_message


class ProblemReportState(StatesGroup):
	waiting_for_reason = State()


router = Router()


@router.callback_query(F.data.startswith("order_status:"))
async def status_update_handler(callback: CallbackQuery, tg_id: int, order_service: BotOrderService, state: FSMContext) -> None:
	"""Отправить изменение статуса заказа в backend."""

	if callback.data is None:
		await callback.answer("Некорректная кнопка.", show_alert=True)
		return

	_, order_id, new_status = callback.data.split(":", 2)

	if new_status == "failed":
		await state.update_data(order_id=order_id)
		await state.set_state(ProblemReportState.waiting_for_reason)
		if callback.message is not None:
			await callback.message.answer(
				format_warning_message("Пожалуйста, опишите причину проблемы с заказом.", "Проблема с заказом")
			)
		await callback.answer()
		return

	try:
		await order_service.update_status(order_id=order_id, tg_id=tg_id, new_status=new_status)
	except BackendClientError as error:
		await callback.answer(f"Не удалось обновить статус: {error.detail}", show_alert=True)
		return

	status_text = {
		"in_transit": "заказ взят в работу",
		"delivered": "заказ доставлен",
	}.get(new_status, new_status)

	await callback.answer("Статус обновлён.")
	if callback.message is not None:
		await callback.message.answer(format_success_message(f"Статус заказа успешно обновлён: {status_text}."))


@router.message(ProblemReportState.waiting_for_reason)
async def process_problem_reason(message: Message, state: FSMContext, tg_id: int, order_service: BotOrderService) -> None:
	"""Обработать текст причины проблемы."""

	data = await state.get_data()
	order_id = data.get("order_id")
	reason = message.text

	if not order_id or not reason:
		await message.answer(format_error_message("Данные заказа не найдены или причина не указана."))
		await state.clear()
		return

	try:
		await order_service.update_status(order_id=order_id, tg_id=tg_id, new_status="failed", reason=reason)
	except BackendClientError as error:
		await message.answer(format_error_message(f"Не удалось обновить статус: {error.detail}"))
		await state.clear()
		return

	await message.answer(format_success_message("Заказ помечен как проблемный. Причина сохранена."))
	await state.clear()
