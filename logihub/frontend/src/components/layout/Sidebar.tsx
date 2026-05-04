"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Map,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Дашборд", href: "/", icon: LayoutDashboard },
  { label: "Заказы", href: "/orders", icon: ShoppingCart },
  { label: "Маршруты", href: "/routes", icon: Map },
  { label: "Инвентарь", href: "/products", icon: Package },
  { label: "Пользователи", href: "/couriers", icon: Users },
  { label: "Аналитика", href: "/analytics", icon: BarChart3 },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-border bg-background">
      <div className="flex h-14 items-center px-5">
        <span className="text-lg font-bold text-foreground">LogiHub</span>
      </div>

      <nav aria-label="Главная навигация" className="flex-1 px-3 py-2">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary/40"
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
