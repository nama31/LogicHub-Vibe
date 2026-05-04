import type { ProductMargin } from "@/types/analytics";
import { Package, TrendingUp, TrendingDown, Minus } from "lucide-react";

const formatMoney = (val: number = 0) => val.toLocaleString("ru-RU") + " сом";

export function ProductMarginTable({ data }: { data: ProductMargin[] }) {
  if (!data || data.length === 0) {
    return <p className="text-muted-foreground text-sm py-4">Нет данных по товарам.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs text-muted-foreground uppercase bg-beige/10">
          <tr>
            <th className="px-4 py-3 rounded-tl-xl">Товар</th>
            <th className="px-4 py-3 text-right">Продано</th>
            <th className="px-4 py-3 text-right">Выручка</th>
            <th className="px-4 py-3 text-right">Себестоимость</th>
            <th className="px-4 py-3 text-right rounded-tr-xl">Маржа</th>
          </tr>
        </thead>
        <tbody>
          {data.map((p) => {
            const margin = p.margin_percentage;
            return (
              <tr key={p.product_id} className="border-b border-beige/20 last:border-0 hover:bg-beige/5">
                <td className="px-4 py-3 font-medium text-ocean flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-beige/20 flex items-center justify-center shrink-0">
                    <Package size={14} className="text-ocean" />
                  </div>
                  <span className="truncate max-w-[200px]" title={p.title}>{p.title}</span>
                </td>
                <td className="px-4 py-3 text-right font-medium">{p.total_sold} шт</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(p.revenue_som)}</td>
                <td className="px-4 py-3 text-right text-muted-foreground">{formatMoney(p.cost_som)}</td>
                <td className="px-4 py-3 text-right font-bold">
                  <div className="flex flex-col items-end">
                    <span className="text-ocean">
                      {formatMoney(p.profit_som)}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      {margin > 40 ? <TrendingUp size={10} className="text-ocean" /> : margin < 20 ? <TrendingDown size={10} className="text-ocean" /> : <Minus size={10} className="text-muted-foreground" />}
                      <span className="text-muted-foreground">
                        {margin}%
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
