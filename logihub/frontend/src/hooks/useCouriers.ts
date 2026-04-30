"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type { User } from "@/types/user";

export type CourierCreate = {
  name: string;
  role: "courier";
  tg_id: number;
  phone?: string;
};

export type CourierUpdate = {
  name?: string;
  tg_id?: number;
  phone?: string;
  is_active?: boolean;
};

export function useCouriers(params?: { isActive?: boolean }) {
  const [couriers, setCouriers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCouriers = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/users?role=courier";
      if (params?.isActive !== undefined) {
        url += `&is_active=${params.isActive}`;
      }
      const data = await apiGet<User[]>(url);
      setCouriers(Array.isArray(data) ? data : []);
    } catch {
      setCouriers([]);
    } finally {
      setLoading(false);
    }
  }, [params?.isActive]);

  useEffect(() => {
    fetchCouriers();
  }, [fetchCouriers]);

  const createCourier = useCallback(async (data: CourierCreate) => {
    const created = await apiPost<User>("/users", data);
    setCouriers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateCourier = useCallback(async (id: string, data: CourierUpdate) => {
    const updated = await apiPatch<User>(`/users/${id}`, data);
    setCouriers((prev) => prev.map((c) => (c.id === id ? updated : c)));
    return updated;
  }, []);

  return {
    couriers,
    loading,
    refetch: fetchCouriers,
    createCourier,
    updateCourier,
  };
}
