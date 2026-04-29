"""Хендлер списка моих заказов."""

from aiogram import Router, F
from aiogram.types import Message


router = Router()


@router.message(F.text == "📦 Мои заказы")
async def my_orders_handler(message: Message) -> None:
	"""Заглушка для списка заказов."""

	await message.answer("Список заказов будет доступен после подключения выдачи заказов из backend.")
