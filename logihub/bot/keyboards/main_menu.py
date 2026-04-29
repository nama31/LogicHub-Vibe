"""Главное меню бота."""

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def build_main_menu() -> ReplyKeyboardMarkup:
	"""Собрать клавиатуру главного меню."""

	return ReplyKeyboardMarkup(
		keyboard=[
			[KeyboardButton(text="📦 Мои заказы"), KeyboardButton(text="🔔 Новые заказы")],
			[KeyboardButton(text="ℹ️ Помощь")],
		],
		resize_keyboard=True,
	)
