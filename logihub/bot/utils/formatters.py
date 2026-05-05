"""Единые HTML-форматеры сообщений Telegram-бота."""

from __future__ import annotations

import re
from html import escape


def _h(value: object, fallback: str = "—") -> str:
	"""Безопасно подготовить значение для HTML-разметки Telegram."""

	if value is None or value == "":
		return escape(fallback)
	return escape(str(value))


def _order_id(value: object) -> str:
	return f"<code>{_h(value)}</code>"


def _status_label(status: str | None) -> str:
	labels = {
		"pending": "На проверке",
		"new": "Новый",
		"assigned": "Назначен",
		"in_transit": "В пути",
		"delivered": "Доставлен",
		"failed": "Проблема",
	}
	return labels.get(status or "", status or "—")


def _status_emoji(status: str | None) -> str:
	if status == "delivered":
		return "✅"
	if status == "failed":
		return "⚠️"
	return "📦"


def format_success_message(message: str, title: str = "Готово") -> str:
	return f"✅ <b>{_h(title)}</b>\n\n{_h(message)}"


def format_error_message(message: str, title: str = "Ошибка") -> str:
	return f"⚠️ <b>{_h(title)}</b>\n\n{_h(message)}"


def format_warning_message(message: str, title: str = "Внимание") -> str:
	return f"⚠️ <b>{_h(title)}</b>\n\n{_h(message)}"


def format_welcome_message(user_name: str | None, role: str) -> str:
	role_text = "курьер" if role == "courier" else "клиент"
	return (
		"<b>Главное меню</b>\n\n"
		f"Здравствуйте, {_h(user_name, 'пользователь')}.\n"
		f"Вы авторизованы в LogiHub как {role_text}."
	)


def format_registration_prompt() -> str:
	return (
		"<b>Авторизация LogiHub</b>\n\n"
		"Здравствуйте. Вы пока не зарегистрированы в системе.\n"
		"Пожалуйста, поделитесь номером телефона для проверки доступа."
	)


def format_help_message() -> str:
	return (
		"<b>Помощь LogiHub</b>\n\n"
		"Используйте кнопки главного меню для работы с заказами и маршрутами.\n"
		"Действия по заказу доступны через inline-кнопки под карточкой."
	)


def format_order_card(order: dict, role: str = "courier") -> str:
	"""Карточка заказа для курьера или клиента."""

	product_title = order.get("product_title") or order.get("product", {}).get("title") or "Товар"
	quantity = order.get("quantity", 1)
	unit = order.get("unit") or "шт."
	status = order.get("status")

	lines = [
		"📦 <b>Заказ</b>",
		f"<i>ID: {_order_id(order.get('id'))}</i>",
		"",
		f"📦 <b>Товар:</b> {_h(product_title)} × {_h(quantity)} {_h(unit)}",
	]

	if status:
		lines.append(f"{_status_emoji(status)} <b>Статус:</b> {_h(_status_label(status))}")

	address = order.get("delivery_address")
	if address:
		lines.append(f"📍 <b>Адрес:</b> {_h(address)}")

	if role != "client":
		lines.extend(
			[
				f"👤 <b>Клиент:</b> {_h(order.get('customer_name'), 'не указано')}",
				f"📞 <b>Телефон:</b> {_h(order.get('customer_phone'), 'не указан')}",
			]
		)

	courier_fee = order.get("courier_fee_som") or order.get("courier_fee")
	if courier_fee:
		lines.append(f"💳 <b>Оплата курьеру:</b> {_h(courier_fee)} сом")

	note = order.get("note")
	if note:
		lines.extend(["", f"<i>Примечание: {_h(note)}</i>"])

	return "\n".join(lines)


def format_orders_header(count: int, title: str) -> str:
	return f"📦 <b>{_h(title)}</b>\n\nНайдено заказов: <b>{_h(count)}</b>."


def format_product_card(product: dict) -> str:
	title = product.get("title") or product.get("name") or "Товар"
	stock = product.get("stock_quantity")
	unit = product.get("unit") or "шт."
	price = product.get("sale_price_som") or product.get("sale_price")

	lines = [
		f"📦 <b>{_h(title)}</b>",
		f"📦 <b>Остаток:</b> {_h(stock)} {_h(unit)}",
	]
	if price:
		lines.append(f"💳 <b>Цена:</b> {_h(price)} сом")
	return "\n".join(lines)


def format_catalog_intro() -> str:
	return "🛍️ <b>Каталог товаров</b>\n\nВыберите товар для добавления в заказ."


def format_selected_product(product: dict) -> str:
	return (
		"📦 <b>Товар выбран</b>\n\n"
		f"{format_product_card(product)}\n\n"
		"Введите необходимое количество."
	)


def format_cart_update(product_title: str, quantity: int, unit: str, cart_size: int) -> str:
	return (
		"✅ <b>Товар добавлен</b>\n\n"
		f"📦 <b>Товар:</b> {_h(product_title)} × {_h(quantity)} {_h(unit)}\n"
		f"<b>Позиций в корзине:</b> {_h(cart_size)}\n\n"
		"Выберите следующее действие."
	)


def format_client_order_confirmation(cart: list[dict], delivery_address: str, note: str | None) -> str:
	items = [
		f"{index}. {_h(item.get('product_title'))} × {_h(item.get('quantity'))} {_h(item.get('unit'), 'шт.')}"
		for index, item in enumerate(cart, 1)
	]
	return (
		"📦 <b>Подтверждение заказа</b>\n\n"
		f"📦 <b>Товары:</b>\n" + "\n".join(items) + "\n\n"
		f"📍 <b>Адрес:</b> {_h(delivery_address)}\n"
		f"<i>Примечание: {_h(note, 'нет')}</i>\n\n"
		"Проверьте данные и подтвердите оформление."
	)


def format_client_order_success(order_ids: list, cart_size: int) -> str:
	ids = ", ".join(_order_id(order_id) for order_id in order_ids) or "—"
	return (
		"✅ <b>Заказ успешно оформлен</b>\n\n"
		f"<b>ID заказов:</b> {ids}\n"
		f"<b>Всего позиций:</b> {_h(cart_size)}\n\n"
		"Менеджер свяжется с вами для подтверждения цены и времени доставки."
	)


def format_client_orders_list(orders: list[dict]) -> str:
	lines = ["📦 <b>Мои заказы</b>", ""]
	for order in orders[:10]:
		lines.append(format_order_card(order, role="client"))
		lines.append("")
	return "\n".join(lines).strip()


def format_route_card(route: dict) -> str:
	label = route.get("label") or f"Маршрут #{str(route.get('id', ''))[:8]}"
	stops_total = route.get("stops_total", 0)

	return (
		"📦 <b>Новый маршрут назначен</b>\n\n"
		f"<b>Маршрут:</b> {_h(label)}\n"
		f"<b>Остановок:</b> {_h(stops_total)}\n\n"
		"Нажмите кнопку ниже, чтобы начать выполнение."
	)


def format_stop_card(route: dict, stop: dict, stop_num: int) -> str:
	stops_total = route.get("stops_total", 0)
	remaining = max(stops_total - stop_num, 0)
	label = route.get("label") or f"Маршрут #{str(route.get('id', ''))[:8]}"
	note = stop.get("note")

	lines = [
		f"📍 <b>{_h(label)}</b>",
		f"<i>Остановка: {_h(stop_num)} из {_h(stops_total)}</i>",
		"",
		f"📍 <b>Адрес:</b> {_h(stop.get('delivery_address'))}",
		f"👤 <b>Клиент:</b> {_h(stop.get('customer_name'), 'не указано')}",
		f"📞 <b>Телефон:</b> {_h(stop.get('customer_phone'), 'не указан')}",
		f"📦 <b>Товар:</b> {_h(stop.get('product_title'), 'Товар')} × {_h(stop.get('quantity', 1))}",
	]
	if note:
		lines.extend(["", f"<i>Примечание: {_h(note)}</i>"])
	lines.extend(["", f"<b>Осталось остановок:</b> {_h(remaining)}"])
	return "\n".join(lines)


def format_completion_card(route: dict, courier_name: str) -> str:
	label = route.get("label") or f"Маршрут #{str(route.get('id', ''))[:8]}"
	stops_total = route.get("stops_total", 0)
	stops_delivered = route.get("stops_delivered", 0)
	stops_failed = route.get("stops_failed", 0)

	return (
		"✅ <b>Маршрут завершён</b>\n\n"
		f"<b>Маршрут:</b> {_h(label)}\n"
		f"✅ <b>Доставлено:</b> {_h(stops_delivered)} из {_h(stops_total)}\n"
		f"⚠️ <b>Проблемы:</b> {_h(stops_failed)}\n\n"
		f"Отличная работа, {_h(courier_name)}."
	)


def format_daily_summary(stats: dict, date_str: str) -> str:
	routes_count = stats.get("routes_count", 0)
	delivered = stats.get("stops_delivered", 0)
	total = stats.get("stops_total", 0)
	failed = stats.get("stops_failed", 0)

	return (
		f"✅ <b>Итоги дня · {_h(date_str)}</b>\n\n"
		f"<b>Маршрутов:</b> {_h(routes_count)}\n"
		f"✅ <b>Доставлено:</b> {_h(delivered)} из {_h(total)} остановок\n"
		f"⚠️ <b>Проблемы:</b> {_h(failed)}"
	)


def make_maps_link(address: str) -> str:
	"""Формирует ссылку на Yandex Maps с предзаполненным адресом."""

	from urllib.parse import quote

	return f"https://yandex.com/maps/?text={quote(address)}"


def make_phone_link(phone: str) -> str:
	"""Формирует ссылку для звонка."""

	digits = re.sub(r"[^\d+]", "", phone)
	return f"tel:{digits}"
