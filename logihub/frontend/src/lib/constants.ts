import type { OrderStatus } from "@/types/order";

/** Russian labels for order statuses — mirrors backend STATUS_LABELS_RU */
export const STATUS_LABELS_RU: Record<OrderStatus, string> = {
  new:        "Новый",
  assigned:   "Назначен",
  in_transit: "В пути",
  delivered:  "Доставлен",
  failed:     "Не доставлен",
};

/** Allowed status transitions — mirrors backend STATUS_TRANSITIONS */
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new:        ["assigned"],
  assigned:   ["in_transit", "new"],
  in_transit: ["delivered", "failed"],
  delivered:  [],
  failed:     [],
};

export const USER_ROLES = ["admin", "courier"] as const;
