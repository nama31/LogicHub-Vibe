"""Хендлеры заказа для клиентов."""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup
from aiogram.fsm.context import FSMContext
from bot.states.client_order import ClientOrderStates
from bot.services.order_service import BotOrderService
import re

router = Router()

@router.message(F.text == "🛍 Сделать заказ")
async def start_client_order(message: Message, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Начало процесса заказа: показ каталога."""
    await state.clear()
    await state.update_data(cart=[])
    await show_catalog(message, state, order_service, tg_id)

async def show_catalog(message: Message, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Показ каталога товаров."""
    catalog = await order_service.get_catalog(tg_id)
    if not catalog:
        await message.answer("К сожалению, сейчас нет доступных товаров.")
        return

    buttons = []
    for item in catalog:
        buttons.append([InlineKeyboardButton(
            text=f"{item['title']} ({item['stock_quantity']} {item['unit']})",
            callback_data=f"buy_prod:{item['id']}"
        )])
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=buttons)
    await message.answer("Выберите товар из каталога:", reply_markup=keyboard)
    await state.set_state(ClientOrderStates.selecting_product)

@router.callback_query(F.data.startswith("buy_prod:"), ClientOrderStates.selecting_product)
async def select_product(callback: CallbackQuery, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Выбор товара и запрос количества."""
    product_id = callback.data.split(":")[1]
    
    # Можно было бы еще раз проверить наличие, но для простоты верим кэшу/каталогу
    catalog = await order_service.get_catalog(tg_id)
    product = next((p for p in catalog if str(p['id']) == product_id), None)
    
    if not product:
        await callback.answer("Товар не найден или закончился.", show_alert=True)
        return

    await state.update_data(product_id=product_id, product_title=product['title'], max_qty=product['stock_quantity'], unit=product['unit'])
    
    await callback.message.edit_text(
        f"Вы выбрали: <b>{product['title']}</b>\n"
        f"Доступно: {product['stock_quantity']} {product['unit']}\n\n"
        "Введите необходимое количество:",
        parse_mode="HTML"
    )
    await state.set_state(ClientOrderStates.entering_quantity)
    await callback.answer()

@router.message(ClientOrderStates.entering_quantity)
async def enter_quantity(message: Message, state: FSMContext):
    """Ввод количества."""
    if not message.text or not message.text.isdigit():
        await message.answer("Пожалуйста, введите число.")
        return
    
    qty = int(message.text)
    data = await state.get_data()
    
    if qty <= 0:
        await message.answer("Количество должно быть больше нуля.")
        return
    
    if qty > data['max_qty']:
        await message.answer(f"Недостаточно товара. Максимум: {data['max_qty']} {data['unit']}")
        return
    
    # Сохраняем в корзину
    item = {
        "product_id": data['product_id'],
        "product_title": data['product_title'],
        "quantity": qty,
        "unit": data['unit']
    }
    
    cart = data.get('cart', [])
    cart.append(item)
    await state.update_data(cart=cart)
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="➕ Добавить еще", callback_data="add_more"),
            InlineKeyboardButton(text="🏁 Оформить заказ", callback_data="go_to_checkout")
        ],
        [
            InlineKeyboardButton(text="❌ Отмена", callback_data="cancel_order")
        ]
    ])
    
    await message.answer(
        f"✅ Добавлено: <b>{data['product_title']}</b> ({qty} {data['unit']})\n"
        f"Всего в корзине: {len(cart)} поз.\n\n"
        "Что делаем дальше?",
        reply_markup=keyboard,
        parse_mode="HTML"
    )
    await state.set_state(ClientOrderStates.choosing_next_action)

@router.callback_query(F.data == "add_more", ClientOrderStates.choosing_next_action)
async def add_more_items(callback: CallbackQuery, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Возврат к каталогу для добавления еще товаров."""
    await show_catalog(callback.message, state, order_service, tg_id)
    await callback.answer()

@router.callback_query(F.data == "go_to_checkout", ClientOrderStates.choosing_next_action)
async def start_checkout(callback: CallbackQuery, state: FSMContext):
    """Начало оформления: запрос адреса."""
    await callback.message.answer("Введите адрес доставки:")
    await state.set_state(ClientOrderStates.entering_address)
    await callback.answer()

@router.message(ClientOrderStates.entering_address)
async def enter_address(message: Message, state: FSMContext):
    """Ввод адреса."""
    if not message.text:
        await message.answer("Пожалуйста, введите адрес.")
        return
    
    await state.update_data(delivery_address=message.text)
    await message.answer("Введите примечание к заказу (или напишите 'нет'):")
    await state.set_state(ClientOrderStates.entering_note)

@router.message(ClientOrderStates.entering_note)
async def enter_note(message: Message, state: FSMContext):
    """Ввод примечания и подтверждение."""
    note = message.text if message.text and message.text.lower() != "нет" else None
    await state.update_data(note=note)
    
    data = await state.get_data()
    cart = data.get('cart', [])
    
    cart_text = ""
    for idx, item in enumerate(cart, 1):
        cart_text += f"{idx}. {item['product_title']} — {item['quantity']} {item['unit']}\n"

    summary = (
        f"📦 <b>Подтверждение заказа</b>\n\n"
        f"🛒 <b>Товары:</b>\n{cart_text}\n"
        f"📍 <b>Адрес:</b> {data['delivery_address']}\n"
        f"📝 <b>Примечание:</b> {data['note'] or 'нет'}\n\n"
        "Все верно?"
    )
    
    keyboard = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="✅ Да, заказать", callback_data="confirm_order"),
            InlineKeyboardButton(text="❌ Отмена", callback_data="cancel_order")
        ]
    ])
    
    await message.answer(summary, reply_markup=keyboard, parse_mode="HTML")
    await state.set_state(ClientOrderStates.confirming)

@router.callback_query(F.data == "confirm_order", ClientOrderStates.confirming)
async def confirm_order(callback: CallbackQuery, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Отправка заказа (корзины) в бэкенд."""
    data = await state.get_data()
    cart = data.get('cart', [])
    
    try:
        # Формируем список для бэкенда
        items = [{"product_id": item['product_id'], "quantity": item['quantity']} for item in cart]
        
        result = await order_service.create_batch_order(
            tg_id=tg_id,
            items=items,
            delivery_address=data['delivery_address'],
            note=data['note']
        )
        
        order_ids = result.get('order_ids', [])
        ids_text = ", ".join([f"#{oid}" for oid in order_ids])
        
        await callback.message.edit_text(
            f"✅ <b>Заказ успешно оформлен!</b>\n\n"
            f"ID заказов: {ids_text}\n"
            f"Всего позиций: {len(cart)}\n\n"
            "Менеджер свяжется с вами для подтверждения цен и времени доставки.",
            parse_mode="HTML"
        )
    except Exception as e:
        await callback.message.answer(f"Произошла ошибка при оформлении заказа: {str(e)}")
    
    await state.clear()
    await callback.answer()

@router.callback_query(F.data == "cancel_order", ClientOrderStates.confirming)
async def cancel_order(callback: CallbackQuery, state: FSMContext):
    """Отмена заказа."""
    await state.clear()
    await callback.message.edit_text("Заказ отменен.")
    await callback.answer()

@router.message(F.text == "📋 Мои заказы")
async def show_my_orders(message: Message, order_service: BotOrderService, tg_id: int):
    """Показ списка заказов клиента."""
    orders = await order_service.get_user_orders(tg_id)
    
    if not orders:
        await message.answer("У вас еще нет заказов.")
        return

    text = "📋 <b>Ваши последние заказы:</b>\n\n"
    for o in orders[:10]: # Показываем последние 10
        status_map = {
            "pending": "🔍 На проверке",
            "new": "🆕 Новый",
            "assigned": "⏳ Назначен",
            "in_transit": "🚚 В пути",
            "delivered": "✅ Доставлен",
            "failed": "❌ Отменен/Проблема"
        }
        status_text = status_map.get(o['status'], o['status'])
        text += (
            f"#{o['id']} | {o['product_title']} | {o['quantity']} шт.\n"
            f"Статус: {status_text}\n"
            f"-------------------\n"
        )
    
    await message.answer(text, parse_mode="HTML")
