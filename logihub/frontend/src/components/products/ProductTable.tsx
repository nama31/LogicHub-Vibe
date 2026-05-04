"use client";

import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, PackagePlus } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onRestock: (product: Product) => void;
}

export function ProductTable({ products, onEdit, onDelete, onRestock }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-beige bg-card p-8 text-center shadow-sm">
        <p className="text-sm text-ocean/60">Товаров пока нет. Добавьте первый товар.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-beige bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="border-beige hover:bg-transparent">
            <TableHead className="text-ocean font-semibold">Название</TableHead>
            <TableHead className="text-ocean font-semibold">Цена (сом)</TableHead>
            <TableHead className="text-ocean font-semibold">Остаток</TableHead>
            <TableHead className="text-ocean font-semibold">Ед. изм.</TableHead>
            <TableHead className="text-ocean font-semibold text-right">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
            >
              <TableCell className="text-ocean font-medium">{product.title}</TableCell>
              <TableCell className="text-ocean">
                {product.purchase_price_som.toLocaleString("ru-RU")} сом
              </TableCell>
              <TableCell className="text-ocean">{product.stock_quantity}</TableCell>
              <TableCell className="text-ocean">{product.unit}</TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRestock(product)}
                    className="text-ocean hover:bg-beige/30"
                    title="Пополнить запасы"
                  >
                    <PackagePlus className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(product)}
                    className="text-ocean"
                    title="Редактировать"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(product.id)}
                    className="text-ocean hover:bg-ocean/10"
                    title="Удалить"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
