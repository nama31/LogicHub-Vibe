"""Хендлер /start."""

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from bot.keyboards.main_menu import build_main_menu
from bot.keyboards.registration import build_registration_keyboard
from bot.keyboards.client_menu import build_client_main_menu


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
			"Здравствуйте! Вы не зарегистрированы в системе LogiHub.\n\n"
			"Пожалуйста, нажмите кнопку ниже, чтобы поделиться своим номером телефона для авторизации.",
			reply_markup=build_registration_keyboard(),
		)
		return

	if user_role == "courier":
		await message.answer(
			f"Здравствуйте, {user_name}! Вы авторизованы как курьер LogiHub.",
			reply_markup=build_main_menu(),
		)
	elif user_role == "client":
		await message.answer(
			f"Здравствуйте, {user_name}! Добро пожаловать в LogiHub.",
			reply_markup=build_client_main_menu(),
		)
	else:
		await message.answer("У вас нет прав для работы с ботом.")
