"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import type { ProfitOut } from "@/types/analytics";

interface ProfitChartProps {
  data: ProfitOut | null;
}

export function ProfitChart({ data }: ProfitChartProps) {
  if (!data || !data.breakdown.length) {
    return (
      <div className="h-[400px] flex items-center justify-center text-muted-foreground bg-white/30 rounded-3xl border border-dashed border-beige">
        Нет данных для отображения за выбранный период
      </div>
    );
  }

  // Convert tiyins to som for display
  const chartData = data.breakdown.map((item) => ({
    ...item,
    profit: item.profit_som,
    revenue: item.revenue_som,
    formattedDate: new Date(item.date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="h-[400px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2C365A" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#2C365A" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C4BCB0" opacity={0.2} />
          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#2C365A", fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#2C365A", fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#EEE8DF",
              borderRadius: "16px",
              border: "1px solid #C4BCB0",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              color: "#2C365A"
            }}
            itemStyle={{ color: "#2C365A", fontWeight: "bold" }}
          />
          <Area
            type="monotone"
            dataKey="profit"
            name="Прибыль (сом)"
            stroke="#2C365A"
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorProfit)"
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
