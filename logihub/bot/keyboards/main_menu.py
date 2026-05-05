"""Главное меню бота."""

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def build_main_menu() -> ReplyKeyboardMarkup:
	"""Собрать клавиатуру главного меню (маршрут-ориентированный UX)."""

	return ReplyKeyboardMarkup(
		keyboard=[
			[
				KeyboardButton(text="📦 Открыть маршрут"),
				KeyboardButton(text="📦 Мои заказы"),
			],
			[
				KeyboardButton(text="📦 Новые заказы"),
			],
		],
		resize_keyboard=True,
	)
