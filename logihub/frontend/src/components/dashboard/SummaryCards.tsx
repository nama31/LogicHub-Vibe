"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Package, CheckCircle, AlertTriangle } from "lucide-react";
import type { Summary } from "@/types/analytics";

interface SummaryCardsProps {
  summary: Summary | null;
  loading: boolean;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const formatMoney = (val: number = 0) => {
    return val.toLocaleString("ru-RU") + " сом";
  };

  const cards = [
    {
      title: "Прибыль сегодня",
      value: formatMoney(summary?.today.net_profit_som),
      sub: `${summary?.today.orders_delivered ?? 0} заказов доставлено`,
      icon: TrendingUp,
      color: "text-ocean",
    },
    {
      title: "Активные заказы",
      value: (summary?.open_orders.new ?? 0) + (summary?.open_orders.assigned ?? 0) + (summary?.open_orders.in_transit ?? 0),
      sub: `${summary?.open_orders.new ?? 0} новых, ${summary?.open_orders.in_transit ?? 0} в пути`,
      icon: Package,
      color: "text-ocean",
    },
    {
      title: "Успех (Неделя)",
      value: summary?.this_week.orders_delivered ?? 0,
      sub: `из ${summary?.this_week.orders_created ?? 0} созданных`,
      icon: CheckCircle,
      color: "text-ocean",
    },
    {
      title: "Низкий остаток",
      value: summary?.stock_alerts.length ?? 0,
      sub: "товаров требуют пополнения",
      icon: AlertTriangle,
      color: summary?.stock_alerts.length ? "text-ocean" : "text-ocean",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="h-32 animate-pulse bg-beige/10 border-beige" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, i) => (
        <Card 
          key={i} 
          className="transition-all hover:shadow-md group"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
              <h3 className="text-2xl font-bold text-ocean tracking-tight">
                {card.value}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {card.sub}
              </p>
            </div>
            <div className={`rounded-xl border border-beige bg-beige/20 p-3 ${card.color}`}>
              <card.icon size={20} className="group-hover:scale-110 transition-transform" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
