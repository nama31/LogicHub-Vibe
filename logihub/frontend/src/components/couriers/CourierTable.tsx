"use client";

import type { User } from "@/types/user";

// GET /users?role=courier
// PATCH /users/:id (toggle is_active)

interface CourierTableProps {
  couriers?: User[];
  onEdit?: (user: User) => void;
}

export function CourierTable({ couriers = [], onEdit }: CourierTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Имя</th>
          <th>Telegram ID</th>
          <th>Телефон</th>
          <th>Статус</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {couriers.map((c) => (
          <tr key={c.id}>
            <td>{c.name}</td>
            <td>{c.tg_id ?? "—"}</td>
            <td>{c.phone ?? "—"}</td>
            <td>{c.is_active ? "Активен" : "Отключён"}</td>
            <td>
              <button onClick={() => onEdit?.(c)}>✏️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
