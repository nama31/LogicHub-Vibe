"""Хендлер помощи."""

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message


router = Router()


@router.message(Command("help"))
async def help_handler(message: Message) -> None:
	"""Показать помощь."""

	await message.answer(
		"Используйте кнопки главного меню для работы с заказами. "
		"Статус заказа меняется через inline-кнопки в карточке заказа."
	)
