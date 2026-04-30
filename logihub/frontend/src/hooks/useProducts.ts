"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDel } from "@/lib/api";
import type { Product, ProductCreate, ProductUpdate } from "@/types/product";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet<Product[]>("/products");
      setProducts(data);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    apiGet<Product[]>("/products")
      .then((data) => {
        if (!cancelled) setProducts(data);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const createProduct = useCallback(
    async (data: ProductCreate) => {
      const created = await apiPost<Product>("/products", data);
      setProducts((prev) => [created, ...prev]);
      return created;
    },
    [],
  );

  const updateProduct = useCallback(
    async (id: string, data: ProductUpdate) => {
      const updated = await apiPatch<Product>(`/products/${id}`, data);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? updated : p)),
      );
      return updated;
    },
    [],
  );

  const deleteProduct = useCallback(
    async (id: string) => {
      await apiDel(`/products/${id}`);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    },
    [],
  );

  return {
    products,
    loading,
    refetch: fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}
