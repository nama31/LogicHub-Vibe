"""Клавиатуры клиентского сценария."""

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, KeyboardButton, ReplyKeyboardMarkup


def build_client_main_menu() -> ReplyKeyboardMarkup:
	"""Собрать клавиатуру главного меню клиента."""

	return ReplyKeyboardMarkup(
		keyboard=[
			[
				KeyboardButton(text="🛍️ Сделать заказ"),
				KeyboardButton(text="🛍️ Мои заказы"),
			],
		],
		resize_keyboard=True,
	)


def build_catalog_keyboard(catalog: list[dict]) -> InlineKeyboardMarkup:
	"""Собрать клавиатуру каталога товаров."""

	return InlineKeyboardMarkup(
		inline_keyboard=[
			[
				InlineKeyboardButton(
					text=f"[ 📦 {item['title']} · {item['stock_quantity']} {item['unit']} ]",
					callback_data=f"buy_prod:{item['id']}",
				)
			]
			for item in catalog
		]
	)


def build_cart_actions_keyboard() -> InlineKeyboardMarkup:
	"""Собрать клавиатуру действий с корзиной."""

	return InlineKeyboardMarkup(
		inline_keyboard=[
			[
				InlineKeyboardButton(text="[ 📦 Добавить товар ]", callback_data="add_more"),
				InlineKeyboardButton(text="[ ✅ Оформить заказ ]", callback_data="go_to_checkout"),
			],
			[
				InlineKeyboardButton(text="[ ⚠️ Отменить заказ ]", callback_data="cancel_order"),
			],
		]
	)


def build_order_confirmation_keyboard() -> InlineKeyboardMarkup:
	"""Собрать клавиатуру подтверждения заказа."""

	return InlineKeyboardMarkup(
		inline_keyboard=[
			[
				InlineKeyboardButton(text="[ ✅ Подтвердить заказ ]", callback_data="confirm_order"),
				InlineKeyboardButton(text="[ ⚠️ Отменить ]", callback_data="cancel_order"),
			]
		]
	)
