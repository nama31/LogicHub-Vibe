"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDel } from "@/lib/api";
import type { Order, OrderCreate, OrderUpdate, OrderListOut, StatusEntry } from "@/types/order";

export function useOrders(params?: {
  status?: string;
  courierId?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const searchParams = new URLSearchParams();
      if (params?.status) searchParams.set("status", params.status);
      if (params?.courierId) searchParams.set("courier_id", params.courierId);
      if (params?.from) searchParams.set("from", params.from);
      if (params?.to) searchParams.set("to", params.to);
      if (params?.limit) searchParams.set("limit", params.limit.toString());
      if (params?.offset) searchParams.set("offset", params.offset.toString());
      
      const q = searchParams.toString();
      const url = `/orders${q ? `?${q}` : ""}`;
      
      const data = await apiGet<Order[]>(url);
      setOrders(Array.isArray(data) ? data : []);
      setTotal(Array.isArray(data) ? data.length : 0);
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.courierId, params?.from, params?.to, params?.limit, params?.offset]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const createOrder = useCallback(async (data: OrderCreate) => {
    const created = await apiPost<Order>("/orders", data);
    setOrders((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateOrder = useCallback(async (id: number | string, data: OrderUpdate) => {
    const updated = await apiPatch<Order>(`/orders/${id}`, data);
    setOrders((prev) => prev.map((o) => (o.id.toString() === id.toString() ? updated : o)));
    return updated;
  }, []);

  const assignCourier = useCallback(async (id: number | string, courier_id: string) => {
    const assigned = await apiPost<Order>(`/orders/${id}/assign`, { courier_id });
    setOrders((prev) => prev.map((o) => (o.id.toString() === id.toString() ? assigned : o)));
    return assigned;
  }, []);
  
  const deleteOrder = useCallback(async (id: number | string) => {
    await apiDel(`/orders/${id}`);
    setOrders((prev) => prev.filter((o) => o.id.toString() !== id.toString()));
  }, []);

  return {
    orders,
    total,
    loading,
    refetch: fetchOrders,
    createOrder,
    updateOrder,
    assignCourier,
    deleteOrder
  };
}

export function useOrder(id: number | string) {
  const [order, setOrder] = useState<Order | null>(null);
  const [timeline, setTimeline] = useState<StatusEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [orderData, timelineData] = await Promise.all([
        apiGet<Order>(`/orders/${id}`),
        apiGet<StatusEntry[]>(`/orders/${id}/timeline`)
      ]);
      setOrder(orderData);
      setTimeline(timelineData);
    } catch {
      setOrder(null);
      setTimeline([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  return {
    order,
    timeline,
    loading,
    refetch: fetchOrder
  };
}
