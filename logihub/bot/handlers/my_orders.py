from aiogram import Router, F
from aiogram.types import Message
from bot.services.order_service import BotOrderService
from bot.keyboards.order_actions import build_order_actions_keyboard
from bot.utils.formatters import format_order_card, format_orders_header, format_success_message

router = Router()


@router.message(F.text == "📦 Мои заказы")
async def my_orders_handler(message: Message, tg_id: int, order_service: BotOrderService) -> None:
	"""Показать список текущих заказов курьера."""

	orders = await order_service.get_courier_orders(tg_id=tg_id)
	
	if not orders:
		await message.answer(format_success_message("Сейчас у вас нет активных заказов.", "Активных заказов нет"))
		return

	await message.answer(format_orders_header(len(orders), "Активные заказы"))
	
	for o in orders:
		await message.answer(
			format_order_card(o, role="courier"),
			reply_markup=build_order_actions_keyboard(o['id']),
		)
