import type { OrderStatus } from "@/types/order";

/** Russian labels for order statuses — mirrors backend STATUS_LABELS_RU */
export const STATUS_LABELS_RU: Record<OrderStatus, string> = {
  pending:    "На проверке",
  new:        "Новый",
  assigned:   "Назначен",
  in_transit: "В пути",
  delivered:  "Доставлен",
  failed:     "Не доставлен",
};

/** Allowed status transitions — mirrors backend STATUS_TRANSITIONS */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:    ["new", "failed"],
  new:        ["assigned", "failed"],
  assigned:   ["in_transit", "new", "failed"],
  in_transit: ["delivered", "failed"],
  delivered:  [],
  failed:     [],
};

export const USER_ROLES = ["admin", "courier", "client"] as const;
