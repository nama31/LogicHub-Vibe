"use client";

import { useState } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProductRestockModalProps {
  product: Product | undefined;
  open: boolean;
  onClose: () => void;
  onSubmit: (id: string, amount: number) => Promise<void>;
}

export function ProductRestockModal({ product, open, onClose, onSubmit }: ProductRestockModalProps) {
  const [amount, setAmount] = useState<number | "">("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!product || !amount || amount <= 0) return;
    
    setLoading(true);
    try {
      await onSubmit(product.id, Number(amount));
      setAmount("");
      onClose();
    } catch (err) {
      console.error("Failed to restock:", err);
      alert("Ошибка при пополнении запасов.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-card text-ocean border-beige">
        <DialogHeader>
          <DialogTitle>Пополнение запасов</DialogTitle>
          <DialogDescription className="text-ocean/70">
            Укажите количество {product?.unit} для добавления к товару "{product?.title}".
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="amount" className="text-sm font-medium">
              Добавляемое количество
            </label>
            <input
              id="amount"
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
              required
              className="flex h-10 w-full rounded-md border border-beige bg-cream/30 px-3 py-2 text-sm text-ocean placeholder:text-ocean/30 focus:outline-none focus:ring-2 focus:ring-ocean/20"
              placeholder="Например: 50"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="border-beige text-ocean hover:bg-beige/20"
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Сохранение..." : "Пополнить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
