"""Хендлер помощи."""

from aiogram import Router
from aiogram.filters import Command
from aiogram.types import Message

from bot.utils.formatters import format_help_message


router = Router()


@router.message(Command("help"))
async def help_handler(message: Message) -> None:
	"""Показать помощь."""

	await message.answer(format_help_message())
