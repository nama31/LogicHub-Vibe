// GET /products?search=&low_stock=

import type { Product } from "@/types/product";

export function useProducts(params?: { search?: string; lowStock?: boolean }) {
  // TODO: const { data, mutate } = useSWR<{ products: Product[] }>(["/products", params], ...)
  return { products: [] as Product[], isLoading: true };
}
