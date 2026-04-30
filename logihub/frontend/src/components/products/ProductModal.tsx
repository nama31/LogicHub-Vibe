"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const productSchema = z.object({
  title: z.string().min(1, "Введите название"),
  purchase_price_som: z.number({ invalid_type_error: "Введите число" }).int("Введите целое число").min(0, "Цена не может быть отрицательной"),
  stock_quantity: z.number({ invalid_type_error: "Введите число" }).int("Введите целое число").min(0, "Количество не может быть отрицательным"),
  unit: z.string().min(1, "Введите единицу измерения"),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductModalProps {
  product?: Product;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
}

export function ProductModal({ product, open, onClose, onSubmit }: ProductModalProps) {
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: "",
      purchase_price_som: 0,
      stock_quantity: 0,
      unit: "шт",
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        product
          ? {
              title: product.title,
              purchase_price_som: product.purchase_price_som,
              stock_quantity: product.stock_quantity,
              unit: product.unit,
            }
          : { title: "", purchase_price_som: 0, stock_quantity: 0, unit: "шт" },
      );
    }
  }, [open, product, reset]);

  async function handleFormSubmit(data: ProductFormData) {
    await onSubmit(data);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ocean">
            {isEdit ? "Редактировать товар" : "Добавить товар"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Измените данные товара" : "Заполните данные нового товара"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Например: Молоко 1л"
              className="h-10"
              {...register("title")}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchase_price_som">Цена (сом)</Label>
            <Input
              id="purchase_price_som"
              type="number"
              min={0}
              placeholder="0"
              className="h-10"
              {...register("purchase_price_som", { valueAsNumber: true })}
            />
            {errors.purchase_price_som && (
              <p className="text-xs text-destructive">{errors.purchase_price_som.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Остаток</Label>
              <Input
                id="stock_quantity"
                type="number"
                min={0}
                placeholder="0"
                className="h-10"
                {...register("stock_quantity", { valueAsNumber: true })}
              />
              {errors.stock_quantity && (
                <p className="text-xs text-destructive">{errors.stock_quantity.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Ед. измерения</Label>
              <Input
                id="unit"
                placeholder="шт, кг, л..."
                className="h-10"
                {...register("unit")}
              />
              {errors.unit && (
                <p className="text-xs text-destructive">{errors.unit.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? "Сохранение..."
                : isEdit
                  ? "Сохранить"
                  : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
