// Formatting utilities used across the UI

import { STATUS_LABELS_RU } from "./constants";
import type { OrderStatus } from "@/types/order";

/** Convert тыйын integer to сом float string — e.g. 5_000_000 → "500.00" */
export function tiyinsToSom(tiyins: number): string {
  return (tiyins / 10_000).toFixed(2);
}

/** Convert сом float to тыйын integer — e.g. 500.0 → 5_000_000 */
export function somToTiyins(som: number): number {
  return Math.round(som * 10_000);
}

/** ISO timestamp → localized date-time string */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ru-KG", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Order status enum → Russian label */
export function statusLabel(status: OrderStatus): string {
  return STATUS_LABELS_RU[status] ?? status;
}
