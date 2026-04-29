"""Константы статусов заказов."""

ORDER_STATUSES = ["new", "assigned", "in_transit", "delivered", "failed"]

STATUS_TRANSITIONS = {
    "new":        ["assigned"],
    "assigned":   ["in_transit", "new"],
    "in_transit": ["delivered", "failed"],
    "delivered":  [],
    "failed":     [],
}

STATUS_LABELS_RU = {
    "new": "Новый",
    "assigned": "Назначен",
    "in_transit": "В пути",
    "delivered": "Доставлен",
    "failed": "Отказ",
}
