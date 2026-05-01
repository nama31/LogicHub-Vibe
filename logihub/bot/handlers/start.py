"""Хендлер /start."""

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from bot.keyboards.main_menu import build_main_menu
from bot.keyboards.registration import build_registration_keyboard


router = Router()


@router.message(CommandStart())
async def start_handler(message: Message, courier_tg_id: int | None = None) -> None:
	"""Приветствие курьера."""

	if courier_tg_id is None:
		await message.answer(
			"Здравствуйте! Вы не зарегистрированы в системе LogiHub.\n\n"
			"Пожалуйста, нажмите кнопку ниже, чтобы поделиться своим номером телефона для авторизации.",
			reply_markup=build_registration_keyboard(),
		)
		return

	await message.answer(
		"Здравствуйте! Вы авторизованы как курьер LogiHub.",
		reply_markup=build_main_menu(),
	)
