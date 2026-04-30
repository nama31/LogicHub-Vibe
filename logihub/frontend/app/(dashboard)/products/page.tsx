"use client";

import { useState } from "react";
import { useProducts } from "@/hooks/useProducts";
import { ProductTable } from "@/components/products/ProductTable";
import { ProductModal } from "@/components/products/ProductModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { Product, ProductCreate, ProductUpdate } from "@/types/product";

export default function ProductsPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  function handleAdd() {
    setEditingProduct(undefined);
    setModalOpen(true);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  async function handleDelete(id: string) {
    await deleteProduct(id);
  }

  async function handleSubmit(data: ProductCreate) {
    if (editingProduct) {
      const updates: ProductUpdate = {};
      if (data.title !== editingProduct.title) updates.title = data.title;
      if (data.purchase_price_som !== editingProduct.purchase_price_som)
        updates.purchase_price_som = data.purchase_price_som;
      if (data.stock_quantity !== editingProduct.stock_quantity)
        updates.stock_quantity = data.stock_quantity;
      if (data.unit !== editingProduct.unit) updates.unit = data.unit;
      await updateProduct(editingProduct.id, updates);
    } else {
      await createProduct(data);
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-ocean">Инвентарь</h1>
        <Button onClick={handleAdd} className="gap-2">
          <Plus className="size-4" />
          Добавить товар
        </Button>
      </div>

      <ProductTable
        products={products}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProductModal
        product={editingProduct}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
