"""Inline-кнопки действий по заказу."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup


def build_order_actions_keyboard(order_id: int | str) -> InlineKeyboardMarkup:
	"""Собрать клавиатуру действий по заказу."""

	return InlineKeyboardMarkup(
		inline_keyboard=[
			[InlineKeyboardButton(text="[ ✅ Взять в работу ]", callback_data=f"order_status:{order_id}:in_transit")],
			[InlineKeyboardButton(text="[ ✅ Доставлено ]", callback_data=f"order_status:{order_id}:delivered")],
			[InlineKeyboardButton(text="[ ⚠️ Проблема ]", callback_data=f"order_status:{order_id}:failed")],
		]
	)
