from aiogram import Router, F
from aiogram.types import Message
from bot.services.order_service import BotOrderService
from bot.keyboards.order_actions import build_order_actions_keyboard

router = Router()


@router.message(F.text == "📦 Мои заказы")
async def my_orders_handler(message: Message, courier_tg_id: int, order_service: BotOrderService) -> None:
	"""Показать список текущих заказов курьера."""

	orders = await order_service.get_courier_orders(tg_id=courier_tg_id)
	
	if not orders:
		await message.answer("У вас нет активных заказов в данный момент.")
		return

	await message.answer(f"У вас *{len(orders)}* активных заказов:")
	
	for o in orders:
		text = (
			f"📦 *Заказ:* `{o['id']}`\\n"
			f"🍎 *Товар:* {o['product_title']} ({o['quantity']} шт.)\\n"
			f"📍 *Адрес:* {o['delivery_address']}\\n"
			f"👤 *Клиент:* {o['customer_name'] or 'не указано'}\\n"
			f"📞 *Телефон:* {o['customer_phone'] or 'не указано'}\\n"
			f"📝 *Заметка:* {o['note'] or 'нет'}"
		)
		await message.answer(
			text, 
			reply_markup=build_order_actions_keyboard(o['id']),
			parse_mode="Markdown"
		)
