"use client";

// GET /analytics/profit?from=&to=&group_by=day|week|courier|product
// Uses Recharts LineChart / BarChart
// Install: pnpm add recharts

interface ProfitChartProps {
  groupBy?: "day" | "week" | "courier" | "product";
  from?: string;
  to?: string;
}

export function ProfitChart({ groupBy = "day", from, to }: ProfitChartProps) {
  return (
    <section aria-label="График прибыли">
      <p>
        График прибыли ({groupBy}) {from} → {to}
      </p>
      {/* TODO: <LineChart> / <BarChart> from recharts */}
      {/* Data shape: { date, orders, revenue_som, cost_som, courier_fees_som, profit_som } */}
    </section>
  );
}
