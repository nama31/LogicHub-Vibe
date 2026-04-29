"use client";

import type { Product } from "@/types/product";

// POST /products (create) or PATCH /products/:id (edit)
// All prices entered in сом, converted to tiyins before sending

interface ProductModalProps {
  product?: Product;          // if provided → edit mode
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ProductModal({ product, isOpen, onClose, onSaved }: ProductModalProps) {
  if (!isOpen) return null;
  const isEdit = Boolean(product);

  return (
    <dialog open aria-label={isEdit ? "Редактировать товар" : "Новый товар"}>
      <h2>{isEdit ? "Редактировать товар" : "Добавить товар"}</h2>
      <form>
        {/* TODO: title, purchase_price_som, stock_quantity, unit */}
        <button type="button" onClick={onClose}>Отмена</button>
        <button type="submit">{isEdit ? "Сохранить" : "Добавить"}</button>
      </form>
    </dialog>
  );
}
