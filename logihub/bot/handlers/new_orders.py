"""Хендлер новых заказов."""

from aiogram import Router, F
from aiogram.types import Message


router = Router()


@router.message(F.text == "🔔 Новые заказы")
async def new_orders_handler(message: Message) -> None:
	"""Заглушка для новых заказов."""

	await message.answer("Раздел новых заказов будет доступен после подключения списка заказов из backend.")
