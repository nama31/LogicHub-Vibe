"""Форматеры сообщений Telegram-бота (строго MarkdownV2)."""

from __future__ import annotations

import re


def _e(text: str | int | None) -> str:
    """Экранировать спецсимволы для MarkdownV2.

    Символы, требующие экранирования: _ * [ ] ( ) ~ ` > # + - = | { } . !
    """
    if text is None:
        return ""
    special = r"\_*[]()~`>#+-=|{}.!"
    return re.sub(r"([" + re.escape(special) + r"])", r"\\\1", str(text))


def format_route_card(route: dict) -> str:
    """Карточка назначения маршрута (пуш от бекенда).

    Пример:
        📦 *Новый маршрут назначен*

        Утренний рейс · 4 остановки
        Нажми кнопку ниже, чтобы начать.
    """
    label = _e(route.get("label") or f"Маршрут #{str(route.get('id', ''))[:8]}")
    stops_total = _e(route.get("stops_total", 0))

    return (
        "📦 *Новый маршрут назначен*\n\n"
        f"{label} · {stops_total} остановок\n"
        "Нажми кнопку ниже, чтобы начать\\."
    )


def format_stop_card(route: dict, stop: dict, stop_num: int) -> str:
    """Карточка активной остановки — показывается после старта или после завершения предыдущей.

    Пример:
        🗺 Маршрут #12 · Остановка 2 из 4
        ━━━━━━━━━━━━━━━━
        📍 пр. Манаса 44, кв. 12
        👤 Айгуль Асанова · +996 700 123 456
        📦 Продукт А × 3 коробки

        💬 Позвонить за 30 минут
        ━━━━━━━━━━━━━━━━
        ⏳ Осталось: 2 остановки
    """
    stops_total = route.get("stops_total", 0)
    remaining = stops_total - stop_num

    label = _e(route.get("label") or f"Маршрут \\#{str(route.get('id', ''))[:8]}")
    address = _e(stop.get("delivery_address", "—"))
    customer_name = _e(stop.get("customer_name") or "не указано")
    customer_phone = _e(stop.get("customer_phone") or "не указан")
    product_title = _e(stop.get("product_title") or "Товар")
    quantity = _e(stop.get("quantity", 1))
    note = stop.get("note")

    lines = [
        f"🗺 *{label} · Остановка {_e(stop_num)} из {_e(stops_total)}*",
        "━━━━━━━━━━━━━━━━",
        f"📍 {address}",
        f"👤 {customer_name} · {customer_phone}",
        f"📦 {product_title} × {quantity}",
    ]
    if note:
        lines.append("")
        lines.append(f"💬 _{_e(note)}_")
    lines.append("━━━━━━━━━━━━━━━━")
    lines.append(f"⏳ Осталось: {_e(remaining)} остановок")

    return "\n".join(lines)


def format_completion_card(route: dict, courier_name: str) -> str:
    """Карточка завершения всего маршрута.

    Пример:
        🎉 Маршрут завершён!

        Маршрут #12
        ✅ Доставлено: 3 из 4
        ⚠️ Не доставлено: 1

        Отличная работа, Бекзат!
    """
    label = _e(route.get("label") or f"Маршрут \\#{str(route.get('id', ''))[:8]}")
    stops_total = route.get("stops_total", 0)
    stops_delivered = route.get("stops_delivered", 0)
    stops_failed = route.get("stops_failed", 0)

    return (
        "🎉 *Маршрут завершён\\!*\n\n"
        f"{label}\n"
        f"✅ Доставлено: {_e(stops_delivered)} из {_e(stops_total)}\n"
        f"⚠️ Не доставлено: {_e(stops_failed)}\n\n"
        f"Отличная работа, {_e(courier_name)}\\!"
    )


def format_daily_summary(stats: dict, date_str: str) -> str:
    """Итоги дня — ежедневный дайджест в 19:00.

    Пример:
        📊 Итоги дня · 28 апреля

        Маршрутов: 2
        Доставлено: 7 из 8 остановок
        Не доставлено: 1
    """
    routes_count = _e(stats.get("routes_count", 0))
    delivered = _e(stats.get("stops_delivered", 0))
    total = _e(stats.get("stops_total", 0))
    failed = _e(stats.get("stops_failed", 0))
    date_escaped = _e(date_str)

    return (
        f"📊 *Итоги дня · {date_escaped}*\n\n"
        f"Маршрутов: {routes_count}\n"
        f"Доставлено: {delivered} из {total} остановок\n"
        f"Не доставлено: {failed}"
    )


def make_maps_link(address: str) -> str:
    """Формирует ссылку на Yandex Maps с предзаполненным адресом."""
    from urllib.parse import quote
    return f"https://yandex.com/maps/?text={quote(address)}"


def make_phone_link(phone: str) -> str:
    """Формирует ссылку для звонка (tel: protocol)."""
    digits = re.sub(r"[^\d+]", "", phone)
    return f"tel:{digits}"
