"""Клавиатура для регистрации."""

from aiogram.types import KeyboardButton, ReplyKeyboardMarkup


def build_registration_keyboard() -> ReplyKeyboardMarkup:
	"""Собрать клавиатуру для запроса контакта."""

	return ReplyKeyboardMarkup(
		keyboard=[
			[KeyboardButton(text="📞 Поделиться контактом", request_contact=True)],
		],
		resize_keyboard=True,
		one_time_keyboard=True,
	)
