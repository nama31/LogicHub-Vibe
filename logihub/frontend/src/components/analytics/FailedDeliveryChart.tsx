"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { FailedReason } from "@/types/analytics";

const COLORS = ["#2C365A", "#C4BCB0", "#EEE8DF"];

export function FailedDeliveryChart({ data }: { data: FailedReason[] }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground bg-card rounded-2xl border border-dashed border-beige">
        Нет данных об отказах
      </div>
    );
  }

  return (
    <div className="h-[350px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#C4BCB0" opacity={0.2} />
          <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#2C365A", fontSize: 12, fontWeight: 500 }} />
          <YAxis
            type="category"
            dataKey="reason"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#2C365A", fontSize: 12, fontWeight: 500 }}
            width={120}
          />
          <Tooltip
            cursor={{ fill: "#C4BCB0" }}
            contentStyle={{
              backgroundColor: "#EEE8DF",
              borderRadius: "16px",
              border: "1px solid #C4BCB0",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              color: "#2C365A",
            }}
            itemStyle={{ fontWeight: "bold", color: "#2C365A" }}
            formatter={(value) => [`${value ?? 0} отказов`, "Количество"]}
          />
          <Bar dataKey="count" radius={[0, 8, 8, 0]} animationDuration={1500} barSize={30}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
