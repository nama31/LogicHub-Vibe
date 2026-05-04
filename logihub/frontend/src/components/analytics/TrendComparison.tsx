"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { TrendItem } from "@/types/analytics";

export function TrendComparison({ data }: { data: TrendItem[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-card rounded-2xl border border-dashed border-beige">
        Нет данных для отображения трендов
      </div>
    );
  }

  const chartData = data.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    }),
  }));

  return (
    <div className="h-[350px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#C4BCB0" opacity={0.2} />
          <XAxis
            dataKey="formattedDate"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#2C365A", fontSize: 12, fontWeight: 500 }}
            dy={10}
          />
          <YAxis
            yAxisId="left"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#2C365A", fontSize: 12, fontWeight: 500 }}
            tickFormatter={(value) => `${value}`}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#C4BCB0", fontSize: 12, fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#EEE8DF",
              borderRadius: "16px",
              border: "1px solid #C4BCB0",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              color: "#2C365A",
            }}
            itemStyle={{ fontWeight: "bold" }}
          />
          <Legend wrapperStyle={{ paddingTop: "20px" }} />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="orders_count"
            name="Заказы (шт)"
            stroke="#2C365A"
            strokeWidth={3}
            dot={{ r: 3, fill: "#2C365A", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="profit_som"
            name="Прибыль (сом)"
            stroke="#C4BCB0"
            strokeWidth={3}
            dot={{ r: 3, fill: "#C4BCB0", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
