"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Product } from "@/types/product";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ProductFormData = {
  title: string;
  purchase_price_som: number;
  selling_price_som: number;
  stock_quantity: number;
  unit: string;
};

type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;

interface ProductModalProps {
  product?: Product;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<any>;
}

const EMPTY_VALUES: ProductFormData = {
  title: "",
  purchase_price_som: 0,
  selling_price_som: 0,
  stock_quantity: 0,
  unit: "шт",
};

export function ProductModal({ product, open, onClose, onSubmit }: ProductModalProps) {
  const isEdit = Boolean(product);
  const [values, setValues] = useState<ProductFormData>(EMPTY_VALUES);
  const [errors, setErrors] = useState<ProductFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    setValues(
      product
        ? {
            title: product.title,
            purchase_price_som: product.purchase_price_som,
            selling_price_som: product.selling_price_som,
            stock_quantity: product.stock_quantity,
            unit: product.unit,
          }
        : EMPTY_VALUES,
    );
    setErrors({});
    setIsSubmitting(false);
  }, [open, product]);

  function updateField<K extends keyof ProductFormData>(field: K, value: ProductFormData[K]) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function validate(nextValues: ProductFormData): ProductFormErrors {
    const nextErrors: ProductFormErrors = {};

    if (!nextValues.title.trim()) nextErrors.title = "Введите название";

    if (!Number.isFinite(nextValues.purchase_price_som)) {
      nextErrors.purchase_price_som = "Введите число";
    } else if (!Number.isInteger(nextValues.purchase_price_som)) {
      nextErrors.purchase_price_som = "Введите целое число";
    } else if (nextValues.purchase_price_som < 0) {
      nextErrors.purchase_price_som = "Цена не может быть отрицательной";
    }
    
    if (!Number.isFinite(nextValues.selling_price_som)) {
      nextErrors.selling_price_som = "Введите число";
    } else if (!Number.isInteger(nextValues.selling_price_som)) {
      nextErrors.selling_price_som = "Введите целое число";
    } else if (nextValues.selling_price_som < 0) {
      nextErrors.selling_price_som = "Цена не может быть отрицательной";
    }

    if (!Number.isFinite(nextValues.stock_quantity)) {
      nextErrors.stock_quantity = "Введите число";
    } else if (!Number.isInteger(nextValues.stock_quantity)) {
      nextErrors.stock_quantity = "Введите целое число";
    } else if (nextValues.stock_quantity < 0) {
      nextErrors.stock_quantity = "Количество не может быть отрицательным";
    }

    if (!nextValues.unit.trim()) nextErrors.unit = "Введите единицу измерения";

    return nextErrors;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);

    try {
      await onSubmit({
        title: values.title.trim(),
        purchase_price_som: values.purchase_price_som,
        selling_price_som: values.selling_price_som,
        stock_quantity: values.stock_quantity,
        unit: values.unit.trim(),
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ocean">
            {isEdit ? "Редактировать товар" : "Добавить товар"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Измените данные товара" : "Заполните данные нового товара"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Название</Label>
            <Input
              id="title"
              placeholder="Например: Молоко 1л"
              className="h-10"
              value={values.title}
              onChange={(e) => updateField("title", e.target.value)}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="purchase_price_som">Цена закупки (сом)</Label>
              <Input
                id="purchase_price_som"
                type="number"
                min={0}
                placeholder="0"
                className="h-10"
                value={Number.isFinite(values.purchase_price_som) ? String(values.purchase_price_som) : ""}
                onChange={(e) => updateField("purchase_price_som", Number(e.target.value))}
              />
              {errors.purchase_price_som && (
                <p className="text-xs text-destructive">{errors.purchase_price_som}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="selling_price_som">Цена продажи (сом)</Label>
              <Input
                id="selling_price_som"
                type="number"
                min={0}
                placeholder="0"
                className="h-10"
                value={Number.isFinite(values.selling_price_som) ? String(values.selling_price_som) : ""}
                onChange={(e) => updateField("selling_price_som", Number(e.target.value))}
              />
              {errors.selling_price_som && (
                <p className="text-xs text-destructive">{errors.selling_price_som}</p>
              )}
            </div>
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
                value={Number.isFinite(values.stock_quantity) ? String(values.stock_quantity) : ""}
                onChange={(e) => updateField("stock_quantity", Number(e.target.value))}
              />
              {errors.stock_quantity && (
                <p className="text-xs text-destructive">{errors.stock_quantity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Ед. измерения</Label>
              <Input
                id="unit"
                placeholder="шт, кг, л..."
                className="h-10"
                value={values.unit}
                onChange={(e) => updateField("unit", e.target.value)}
              />
              {errors.unit && <p className="text-xs text-destructive">{errors.unit}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Сохранение..." : isEdit ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}