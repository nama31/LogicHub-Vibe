"use client";

import type { OrderCreate } from "@/types/order";

// POST /orders — create form
// PATCH /orders/:id — edit form (same component, orderId prop)
// Product dropdown: GET /products
// Courier dropdown: GET /users?role=courier

interface OrderFormProps {
  orderId?: string;           // if provided → edit mode
  onSuccess?: () => void;
}

export function OrderForm({ orderId, onSuccess }: OrderFormProps) {
  const isEdit = Boolean(orderId);

  return (
    <form>
      <h2>{isEdit ? "Редактировать заказ" : "Новый заказ"}</h2>
      {/* TODO: product_id select, quantity, sale_price_som, courier_fee_som */}
      {/* TODO: delivery_address, customer_name, customer_phone, note */}
      {/* TODO: courier_id select (optional) */}
      <button type="submit">{isEdit ? "Сохранить" : "Создать"}</button>
    </form>
  );
}
