"""Главное меню для клиентов."""

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def build_client_main_menu() -> ReplyKeyboardMarkup:
	"""Собрать клавиатуру главного меню клиента."""

	return ReplyKeyboardMarkup(
		keyboard=[
			[KeyboardButton(text="🛍 Сделать заказ")],
			[KeyboardButton(text="📋 Мои заказы")],
		],
		resize_keyboard=True,
	)
