"use client";

import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";

interface StockCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export function StockCard({ product, onEdit, onDelete }: StockCardProps) {
  const isLow = product.stock_quantity < 5;

  return (
    <article
      aria-label={`Товар: ${product.title}`}
      className="rounded-2xl border border-beige bg-card p-6 text-ocean shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold">{product.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Остаток: {product.stock_quantity} {product.unit}
          </p>
        </div>
        {isLow && (
          <span className="rounded-xl border border-ocean/20 bg-ocean/10 px-3 py-1 text-xs font-semibold text-ocean">
            Мало
          </span>
        )}
      </div>
      <p className="mt-4 text-sm text-ocean/70">
        Закупочная цена: {product.purchase_price_som} сом
      </p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => onEdit?.(product)}>
          Редактировать
        </Button>
        <Button variant="ghost" size="sm" onClick={() => onDelete?.(product.id)}>
          Удалить
        </Button>
      </div>
    </article>
  );
}
