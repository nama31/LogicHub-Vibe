"use client";

import type { Product } from "@/types/product";

// GET /products?search=&low_stock=

interface ProductTableProps {
  products?: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (id: string) => void;
}

export function ProductTable({ products = [], onEdit, onDelete }: ProductTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>Название</th>
          <th>Цена (сом)</th>
          <th>Остаток</th>
          <th>Ед.</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {products.map((p) => (
          <tr key={p.id}>
            <td>{p.title}</td>
            <td>{p.purchase_price_som}</td>
            <td>{p.stock_quantity}</td>
            <td>{p.unit}</td>
            <td>
              <button onClick={() => onEdit?.(p)}>✏️</button>
              <button onClick={() => onDelete?.(p.id)}>🗑️</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
