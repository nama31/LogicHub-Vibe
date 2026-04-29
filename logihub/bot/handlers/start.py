"""Хендлер /start."""

from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import Message

from bot.keyboards.main_menu import build_main_menu


router = Router()


@router.message(CommandStart())
async def start_handler(message: Message, courier_tg_id: int) -> None:
	"""Приветствие курьера."""

	await message.answer(
		"Здравствуйте! Вы авторизованы как курьер LogiHub.",
		reply_markup=build_main_menu(),
	)
