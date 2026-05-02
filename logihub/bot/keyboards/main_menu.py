"""Главное меню бота."""

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def build_main_menu() -> ReplyKeyboardMarkup:
	"""Собрать клавиатуру главного меню (маршрут-ориентированный UX)."""

	return ReplyKeyboardMarkup(
		keyboard=[
			[KeyboardButton(text="📦 Активный маршрут")],
			[KeyboardButton(text="📋 История"), KeyboardButton(text="❓ Помощь")],
		],
		resize_keyboard=True,
	)

