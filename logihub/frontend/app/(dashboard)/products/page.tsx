"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductModal } from "@/components/products/ProductModal";
import { ProductRestockModal } from "@/components/products/ProductRestockModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { Product, ProductCreate, ProductUpdate } from "@/types/product";

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct, restockProduct } = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockingProduct, setRestockingProduct] = useState<Product | undefined>();

  function handleAdd() {
    setEditingProduct(undefined);
    setModalOpen(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function handleRestock(product: Product) {
    setRestockingProduct(product);
    setRestockModalOpen(true);
  }

  async function handleDelete(id: string) {
    try {
      await deleteProduct(id);
      toast.success("Товар успешно удален");
    } catch {
      toast.error("Ошибка при удалении товара");
    }
  }

  async function handleRestockSubmit(id: string, amount: number) {
    if (restockProduct) {
      try {
        await restockProduct(id, amount);
        toast.success("Запасы успешно пополнены");
      } catch {
        toast.error("Ошибка при пополнении запасов");
      }
    }
  }

  async function handleSubmit(data: ProductCreate) {
    try {
      if (editingProduct) {
        const updates: ProductUpdate = {};
        if (data.title !== editingProduct.title) updates.title = data.title;
        if (data.purchase_price_som !== editingProduct.purchase_price_som)
          updates.purchase_price_som = data.purchase_price_som;
        if (data.stock_quantity !== editingProduct.stock_quantity)
          updates.stock_quantity = data.stock_quantity;
        if (data.unit !== editingProduct.unit) updates.unit = data.unit;
        await updateProduct(editingProduct.id, updates);
        toast.success("Товар успешно обновлен");
      } else {
        await createProduct(data);
        toast.success("Товар успешно добавлен");
      }
      setModalOpen(false);
    } catch {
      toast.error("Ошибка при сохранении товара");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-ocean border-t-transparent" />
          <span className="text-sm text-ocean/60">Загрузка товаров...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-ocean tracking-tight">Инвентарь</h1>
          <p className="mt-1 text-sm text-muted-foreground">Контроль товаров, цен и складских остатков.</p>
        </div>
        <Button onClick={handleAdd} className="h-11 gap-2 px-5">
          <Plus className="size-4" />
          Добавить товар
        </Button>
      </div>

      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRestock={handleRestock}
      />

      <ProductModal
        product={editingProduct}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      
      <ProductRestockModal
        product={restockingProduct}
        open={restockModalOpen}
        onClose={() => setRestockModalOpen(false)}
        onSubmit={handleRestockSubmit}
      />
    </div>
  );
}
