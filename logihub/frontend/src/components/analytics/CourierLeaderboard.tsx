import type { CourierStat } from "@/types/analytics";
import { Award, TrendingUp, TrendingDown } from "lucide-react";

const formatMoney = (val: number = 0) => val.toLocaleString("ru-RU") + " сом";

export function CourierLeaderboard({ data }: { data: CourierStat[] }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">Нет данных по курьерам.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-beige/10">
          <tr>
            <th className="px-4 py-3 rounded-tl-xl">Курьер</th>
            <th className="px-4 py-3 text-right">Рейсы</th>
            <th className="px-4 py-3 text-right">Остановки</th>
            <th className="px-4 py-3 text-right">Успешно</th>
            <th className="px-4 py-3 text-right rounded-tr-xl">Заработано</th>
          </tr>
        </thead>
        <tbody>
          {data.map((c, index) => {
            const successRate = c.stops_total > 0 ? (c.stops_delivered / c.stops_total) * 100 : 0;
            return (
              <tr key={c.courier_id} className="border-b border-beige/20 last:border-0 hover:bg-beige/5">
                <td className="px-4 py-3 font-medium text-ocean flex items-center gap-2">
                  {index === 0 && <Award size={16} className="text-ocean" />}
                  {index === 1 && <Award size={16} className="text-beige" />}
                  {index === 2 && <Award size={16} className="text-ocean/70" />}
                  {index > 2 && <span className="w-4 inline-block text-center text-muted-foreground">{index + 1}</span>}
                  {c.name}
                </td>
                <td className="px-4 py-3 text-right font-medium">{c.routes_count}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{c.stops_total}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <span className="text-ocean">
                      {c.stops_delivered} ({successRate.toFixed(0)}%)
                    </span>
                    {successRate >= 90 ? <TrendingUp size={14} className="text-ocean" /> : <TrendingDown size={14} className="text-ocean opacity-0" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-ocean">
                  {formatMoney(c.total_fee_som)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
