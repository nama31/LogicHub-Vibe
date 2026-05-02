"""Хендлер маршрутов — главный интерфейс курьера в боте.

Заменяет старую модель одиночных заказов.
Курьер работает с маршрутом: видит текущую остановку,
отмечает доставку/проблему, автоматически переходит к следующей.
"""

from __future__ import annotations

from aiogram import F, Router
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from bot.core.http_client import BackendClient, BackendClientError
from bot.utils.formatters import (
    format_completion_card,
    format_stop_card,
    make_maps_link,
    make_phone_link,
)

router = Router()


def _build_stop_keyboard(route_id: str, stop_id: int, phone: str | None, address: str) -> InlineKeyboardMarkup:
	"""Кнопки действий для текущей остановки."""
	buttons: list[list[InlineKeyboardButton]] = []

	# Row 1: Phone + Map (only if data available)
	row1 = []
	if phone:
		row1.append(InlineKeyboardButton(text="📞 Позвонить", url=make_phone_link(phone)))
	row1.append(InlineKeyboardButton(text="🗺 Навигатор", url=make_maps_link(address)))
	buttons.append(row1)

	# Row 2: Delivered + Problem
	buttons.append([
		InlineKeyboardButton(
			text="✅ Доставлено",
			callback_data=f"stop_done:{route_id}:{stop_id}:delivered",
		),
		InlineKeyboardButton(
			text="⚠️ Проблема",
			callback_data=f"stop_problem:{route_id}:{stop_id}",
		),
	])

	return InlineKeyboardMarkup(inline_keyboard=buttons)


def _build_problem_keyboard(route_id: str, stop_id: int) -> InlineKeyboardMarkup:
	"""Выбор причины неудачи."""
	reasons = [
		("Не открывает дверь", "door"),
		("Неверный адрес", "address"),
		("Клиент отказался", "refused"),
		("Другая причина", "other"),
	]
	return InlineKeyboardMarkup(
		inline_keyboard=[
			[InlineKeyboardButton(
				text=label,
				callback_data=f"stop_done:{route_id}:{stop_id}:failed:{key}",
			)]
			for label, key in reasons
		]
	)


def _reason_text(key: str) -> str:
	mapping = {
		"door": "Не открывает дверь",
		"address": "Неверный адрес",
		"refused": "Клиент отказался",
		"other": "Другая причина",
	}
	return mapping.get(key, key)


def _find_current_stop(route: dict) -> dict | None:
	"""Найти текущую (in_transit) остановку."""
	for stop in route.get("stops", []):
		if stop.get("status") == "in_transit":
			return stop
	return None


def _find_stop_by_id(route: dict, stop_id: int) -> dict | None:
	for stop in route.get("stops", []):
		if stop.get("id") == stop_id:
			return stop
	return None


# ─── Persistent keyboard button: "📦 Активный маршрут" ─────────────────────────

@router.message(F.text == "📦 Активный маршрут")
async def show_active_route(message: Message, courier_tg_id: int, order_service=None, **kwargs) -> None:
	"""Показать текущую остановку активного маршрута."""
	client: BackendClient = kwargs.get("backend_client") or BackendClient()

	route = await client.fetch_active_route(tg_id=courier_tg_id)

	if route is None:
		await message.answer(
			"📭 Активных маршрутов нет\\.\n\nЖдите назначения от менеджера\\.",
			parse_mode="MarkdownV2",
		)
		return

	stop = _find_current_stop(route)
	if stop is None:
		await message.answer(
			"✅ Все остановки завершены\\. Маршрут выполнен\\!",
			parse_mode="MarkdownV2",
		)
		return

	stop_num = stop.get("stop_sequence", 1)
	text = format_stop_card(route, stop, stop_num)
	keyboard = _build_stop_keyboard(
		route_id=str(route["id"]),
		stop_id=stop["id"],
		phone=stop.get("customer_phone"),
		address=stop.get("delivery_address", ""),
	)

	await message.answer(text, parse_mode="MarkdownV2", reply_markup=keyboard)


# ─── Callback: "✅ Доставлено" ───────────────────────────────────────────────

@router.callback_query(F.data.startswith("stop_done:"))
async def handle_stop_done(call: CallbackQuery, courier_tg_id: int, **kwargs) -> None:
	"""Обработать завершение остановки (delivered или failed с причиной)."""
	parts = call.data.split(":")
	# Format: stop_done:{route_id}:{stop_id}:{result}[:{reason_key}]
	if len(parts) < 4:
		await call.answer("Некорректные данные кнопки.")
		return

	_, route_id, stop_id_str, result, *rest = parts
	stop_id = int(stop_id_str)
	failure_reason = _reason_text(rest[0]) if rest else None

	client: BackendClient = kwargs.get("backend_client") or BackendClient()

	try:
		updated_route = await client.complete_route_stop(
			route_id=route_id,
			stop_id=stop_id,
			tg_id=courier_tg_id,
			result=result,
			failure_reason=failure_reason,
		)
	except BackendClientError as exc:
		await call.answer(f"Ошибка: {exc.detail}", show_alert=True)
		return

	await call.answer()

	# Check if route is now completed
	if updated_route.get("status") == "completed":
		courier_name = (updated_route.get("courier") or {}).get("name", "Курьер")
		text = format_completion_card(updated_route, courier_name)
		await call.message.edit_text(text, parse_mode="MarkdownV2")
		return

	# Show next stop
	next_stop = _find_current_stop(updated_route)
	if next_stop is None:
		await call.message.edit_text(
			"✅ Все остановки завершены\\. Маршрут выполнен\\!",
			parse_mode="MarkdownV2",
		)
		return

	stop_num = next_stop.get("stop_sequence", 1)
	text = format_stop_card(updated_route, next_stop, stop_num)
	keyboard = _build_stop_keyboard(
		route_id=str(updated_route["id"]),
		stop_id=next_stop["id"],
		phone=next_stop.get("customer_phone"),
		address=next_stop.get("delivery_address", ""),
	)
	await call.message.edit_text(text, parse_mode="MarkdownV2", reply_markup=keyboard)


# ─── Callback: "⚠️ Проблема" — показать причины ─────────────────────────────

@router.callback_query(F.data.startswith("stop_problem:"))
async def handle_stop_problem(call: CallbackQuery, **kwargs) -> None:
	"""Показать меню выбора причины неудачи."""
	parts = call.data.split(":")
	if len(parts) < 3:
		await call.answer("Некорректные данные.")
		return

	_, route_id, stop_id_str = parts[:3]
	keyboard = _build_problem_keyboard(route_id, int(stop_id_str))
	await call.message.edit_reply_markup(reply_markup=keyboard)
	await call.answer()


# ─── Callback: route_start (from backend push) ───────────────────────────────

@router.callback_query(F.data.startswith("route_start:"))
async def handle_route_start_button(call: CallbackQuery, courier_tg_id: int, **kwargs) -> None:
	"""Курьер нажал 'Начать маршрут' на уведомлении от бекенда."""
	route_id = call.data.split(":", 1)[1]
	client: BackendClient = kwargs.get("backend_client") or BackendClient()

	route = await client.fetch_route_by_id(route_id)
	if route is None:
		await call.answer("Маршрут не найден.", show_alert=True)
		return

	stop = _find_current_stop(route)
	if stop is None:
		await call.answer("Нет активных остановок.", show_alert=True)
		return

	stop_num = stop.get("stop_sequence", 1)
	text = format_stop_card(route, stop, stop_num)
	keyboard = _build_stop_keyboard(
		route_id=str(route["id"]),
		stop_id=stop["id"],
		phone=stop.get("customer_phone"),
		address=stop.get("delivery_address", ""),
	)
	await call.message.edit_text(text, parse_mode="MarkdownV2", reply_markup=keyboard)
	await call.answer()
