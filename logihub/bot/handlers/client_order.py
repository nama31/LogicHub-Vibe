"""Хендлеры заказа для клиентов."""

from aiogram import Router, F
from aiogram.types import Message, CallbackQuery
from aiogram.fsm.context import FSMContext
from bot.states.client_order import ClientOrderStates
from bot.services.order_service import BotOrderService
from bot.keyboards.client_menu import (
    build_cart_actions_keyboard,
    build_catalog_keyboard,
    build_order_confirmation_keyboard,
)
from bot.utils.formatters import (
    format_cart_update,
    format_catalog_intro,
    format_client_order_confirmation,
    format_client_order_success,
    format_client_orders_list,
    format_error_message,
    format_selected_product,
    format_success_message,
    format_warning_message,
)

router = Router()

@router.message(F.text.in_({"🛍️ Сделать заказ", "🛍 Сделать заказ"}))
async def start_client_order(message: Message, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Начало процесса заказа: показ каталога."""
    await state.clear()
    await state.update_data(cart=[])
    await show_catalog(message, state, order_service, tg_id)

async def show_catalog(message: Message, state: FSMContext, order_service: BotOrderService, tg_id: int):
    """Показ каталога товаров."""
    catalog = await order_service.get_catalog(tg_id)
    if not catalog:
        await message.answer(format_warning_message("Сейчас нет доступных товаров.", "Каталог пуст"))
        return

    await message.answer(format_catalog_intro(), reply_markup=build_catalog_keyboard(catalog))
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

    await state.update_data(
        product_id=product_id,
        product_title=product['title'],
        max_qty=product['stock_quantity'],
        unit=product['unit'],
        selling_price=product.get('selling_price', 0),
    )
    
    await callback.message.edit_text(
        format_selected_product(product)
    )
    await state.set_state(ClientOrderStates.entering_quantity)
    await callback.answer()

@router.message(ClientOrderStates.entering_quantity)
async def enter_quantity(message: Message, state: FSMContext):
    """Ввод количества."""
    if not message.text or not message.text.isdigit():
        await message.answer(format_warning_message("Пожалуйста, введите количество числом."))
        return
    
    qty = int(message.text)
    data = await state.get_data()
    
    if qty <= 0:
        await message.answer(format_warning_message("Количество должно быть больше нуля."))
        return
    
    if qty > data['max_qty']:
        await message.answer(format_warning_message(f"Недостаточно товара. Максимум: {data['max_qty']} {data['unit']}."))
        return
    
    # Сохраняем в корзину
    item = {
        "product_id": data['product_id'],
        "product_title": data['product_title'],
        "quantity": qty,
        "unit": data['unit'],
        "selling_price": data.get('selling_price', 0),
    }
    
    cart = data.get('cart', [])
    cart.append(item)
    await state.update_data(cart=cart)
    
    await message.answer(
        format_cart_update(data['product_title'], qty, data['unit'], len(cart)),
        reply_markup=build_cart_actions_keyboard(),
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
    await callback.message.answer("📍 <b>Адрес доставки</b>\n\nВведите полный адрес доставки.")
    await state.set_state(ClientOrderStates.entering_address)
    await callback.answer()

@router.message(ClientOrderStates.entering_address)
async def enter_address(message: Message, state: FSMContext):
    """Ввод адреса."""
    if not message.text:
        await message.answer(format_warning_message("Пожалуйста, введите адрес доставки."))
        return
    
    await state.update_data(delivery_address=message.text)
    await message.answer("<b>Примечание к заказу</b>\n\nВведите комментарий или напишите «нет».")
    await state.set_state(ClientOrderStates.entering_note)

@router.message(ClientOrderStates.entering_note)
async def enter_note(message: Message, state: FSMContext):
    """Ввод примечания и подтверждение."""
    note = message.text if message.text and message.text.lower() != "нет" else None
    await state.update_data(note=note)
    
    data = await state.get_data()
    cart = data.get('cart', [])
    
    await message.answer(
        format_client_order_confirmation(cart, data['delivery_address'], data['note']),
        reply_markup=build_order_confirmation_keyboard(),
    )
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
        
        await callback.message.edit_text(format_client_order_success(order_ids, len(cart)))
    except Exception as e:
        await callback.message.answer(format_error_message(f"Произошла ошибка при оформлении заказа: {str(e)}"))
    
    await state.clear()
    await callback.answer()

@router.callback_query(F.data == "cancel_order", ClientOrderStates.confirming)
async def cancel_order(callback: CallbackQuery, state: FSMContext):
    """Отмена заказа."""
    await state.clear()
    await callback.message.edit_text(format_warning_message("Заказ отменён.", "Оформление остановлено"))
    await callback.answer()

@router.message(F.text.in_({"🛍️ Мои заказы", "📦 Мои заказы"}))
async def show_my_orders(message: Message, order_service: BotOrderService, tg_id: int):
    """Показ списка заказов клиента."""
    orders = await order_service.get_user_orders(tg_id)
    
    if not orders:
        await message.answer(format_success_message("У вас пока нет заказов.", "Заказов нет"))
        return

    await message.answer(format_client_orders_list(orders))
