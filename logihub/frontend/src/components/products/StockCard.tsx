"use client";

import type { Product } from "@/types/product";

// Highlights low-stock (stock_quantity < 5) with a warning color
// Calls PATCH /products/:id, DELETE /products/:id

interface StockCardProps {
  product: Product;
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export function StockCard({ product, onEdit, onDelete }: StockCardProps) {
  const isLow = product.stock_quantity < 5;

  return (
    <article aria-label={`Товар: ${product.title}`} style={{ borderColor: isLow ? "red" : "green" }}>
      <h3>{product.title}</h3>
      <p>Остаток: {product.stock_quantity} {product.unit}</p>
      <p>Закупочная цена: {product.purchase_price_som} сом</p>
      {isLow && <span>⚠️ Мало на складе</span>}
      <button onClick={() => onEdit?.(product)}>Редактировать</button>
      <button onClick={() => onDelete?.(product.id)}>Удалить</button>
    </article>
  );
}
