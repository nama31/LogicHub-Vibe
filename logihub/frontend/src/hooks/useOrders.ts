// GET /orders?status=&courier_id=&from=&to=&limit=&offset=
// Uses SWR or React Query for cache invalidation after mutations

import type { OrderListOut } from "@/types/order";

export function useOrders(params?: {
  status?: string;
  courierId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  // TODO: const { data, mutate } = useSWR<OrderListOut>(["/orders", params], ...)
  return { orders: [] as OrderListOut["orders"], total: 0, isLoading: true };
}
