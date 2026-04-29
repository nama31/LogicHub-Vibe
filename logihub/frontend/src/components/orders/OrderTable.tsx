"use client";

import type { Order } from "@/types/order";

// Renders a filterable table of orders
// Filters: status, courier_id, from, to, limit, offset
// Status badges use STATUS_LABELS_RU from @/lib/constants

interface OrderTableProps {
  orders?: Order[];
}

export function OrderTable({ orders = [] }: OrderTableProps) {
  return (
    <div>
      {/* TODO: filters bar */}
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Товар</th>
            <th>Курьер</th>
            <th>Статус</th>
            <th>Адрес</th>
            <th>Прибыль</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.id}</td>
              <td>{o.product?.title}</td>
              <td>{o.courier?.name ?? "—"}</td>
              <td>{o.status}</td>
              <td>{o.delivery_address}</td>
              <td>{o.net_profit_som} сом</td>
              <td>{o.created_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
