"""Хендлер /start."""

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from bot.keyboards.main_menu import build_main_menu
from bot.keyboards.registration import build_registration_keyboard
from bot.keyboards.client_menu import build_client_main_menu
from bot.utils.formatters import format_registration_prompt, format_warning_message, format_welcome_message


router = Router()


@router.message(CommandStart())
async def start_handler(
	message: Message, 
	user_role: str | None = None, 
	user_name: str | None = None
) -> None:
	"""Приветствие пользователя."""

	if user_role is None:
		await message.answer(
			format_registration_prompt(),
			reply_markup=build_registration_keyboard(),
		)
		return

	if user_role == "courier":
		await message.answer(
			format_welcome_message(user_name, "courier"),
			reply_markup=build_main_menu(),
		)
	elif user_role == "client":
		await message.answer(
			format_welcome_message(user_name, "client"),
			reply_markup=build_client_main_menu(),
		)
	else:
		await message.answer(format_warning_message("У вас нет прав для работы с ботом.", "Доступ ограничен"))
