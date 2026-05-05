"""Константы статусов заказов."""

ORDER_STATUSES = ["pending", "new", "assigned", "in_transit", "delivered", "failed"]

STATUS_TRANSITIONS = {
    "pending":    ["new", "failed"],
    "new":        ["assigned", "failed"],
    "assigned":   ["in_transit", "new", "failed"],
    "in_transit": ["delivered", "failed"],
    "delivered":  [],
    "failed":     [],
}
