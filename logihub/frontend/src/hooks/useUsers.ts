"use client";
/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDel } from "@/lib/api";
import type { User, UserRole } from "@/types/user";

export type UserCreateData = {
  name: string;
  role: UserRole;
  tg_id?: number | null;
  phone?: string;
};

export type UserUpdateData = {
  name?: string;
  role?: UserRole;
  tg_id?: number | null;
  phone?: string;
  is_active?: boolean;
};

export function useUsers(params?: { role?: UserRole; isActive?: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      let url = "/users";
      const queryParams = new URLSearchParams();
      if (params?.role) queryParams.append("role", params.role);
      if (params?.isActive !== undefined) queryParams.append("is_active", String(params.isActive));
      
      const queryString = queryParams.toString();
      if (queryString) url += `?${queryString}`;

      const data = await apiGet<User[]>(url);
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [params?.role, params?.isActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const createUser = useCallback(async (data: UserCreateData) => {
    const created = await apiPost<User>("/users", data);
    setUsers((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateUser = useCallback(async (id: string, data: UserUpdateData) => {
    const updated = await apiPatch<User>(`/users/${id}`, data);
    setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    await apiDel(`/users/${id}`);
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  return {
    users,
    loading,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
