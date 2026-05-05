from aiogram import Router, F
from aiogram.types import Message
from bot.services.order_service import BotOrderService
from bot.keyboards.order_actions import build_order_actions_keyboard
from bot.utils.formatters import format_order_card, format_orders_header, format_success_message

router = Router()


@router.message(F.text == "📦 Новые заказы")
async def new_orders_handler(message: Message, tg_id: int, order_service: BotOrderService) -> None:
	"""Показать новые (назначенные) заказы курьера."""

	orders = await order_service.get_courier_orders(tg_id=tg_id, status_filter="assigned")
	
	if not orders:
		await message.answer(format_success_message("Новых назначенных заказов пока нет.", "Новых заказов нет"))
		return

	await message.answer(format_orders_header(len(orders), "Новые назначенные заказы"))
	
	for o in orders:
		await message.answer(
			format_order_card(o, role="courier"),
			reply_markup=build_order_actions_keyboard(o['id']),
		)
