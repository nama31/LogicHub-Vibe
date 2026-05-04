from aiogram import Router, F
from aiogram.types import Message
from bot.services.order_service import BotOrderService
from bot.keyboards.order_actions import build_order_actions_keyboard

router = Router()


@router.message(F.text == "🔔 Новые заказы")
async def new_orders_handler(message: Message, tg_id: int, order_service: BotOrderService) -> None:
	"""Показать новые (назначенные) заказы курьера."""

	orders = await order_service.get_courier_orders(tg_id=tg_id, status_filter="assigned")
	
	if not orders:
		await message.answer("Новых заказов пока нет. Отдыхайте! ☕️")
		return

	await message.answer(f"🔔 У вас *{len(orders)}* новых назначенных заказов:")
	
	for o in orders:
		text = (
			f"📦 <b>Заказ:</b> <code>{o['id']}</code>\n"
			f"🍎 <b>Товар:</b> {o['product_title']} ({o['quantity']} шт.)\n"
			f"📍 <b>Адрес:</b> {o['delivery_address']}\n"
			f"👤 <b>Клиент:</b> {o['customer_name'] or 'не указано'}\n"
			f"📞 <b>Телефон:</b> {o['customer_phone'] or 'не указано'}"
		)
		if o.get("note"):
			text += f"\n📝 <b>Заметка:</b> {o['note']}"
            
		await message.answer(
			text, 
			reply_markup=build_order_actions_keyboard(o['id']),
			parse_mode="HTML"
		)
