"use client";

import Link from "next/link";

const navItems = [
  { label: "Дашборд", href: "/" },
  { label: "Заказы", href: "/orders" },
  { label: "Инвентарь", href: "/products" },
  { label: "Курьеры", href: "/couriers" },
  { label: "Аналитика", href: "/analytics" },
];

export function Sidebar() {
  return (
    <nav aria-label="Главная навигация" style={{ width: 240 }}>
      <ul>
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
