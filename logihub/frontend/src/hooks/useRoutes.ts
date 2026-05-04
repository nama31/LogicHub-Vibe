"use client";
/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDel } from "@/lib/api";
import type { Route, RouteListItem, RouteListResponse, RouteCreate, RouteUpdate } from "@/types/route";
import type { ApiError } from "@/types/api";

type RealtimeUpdateEvent = CustomEvent<{ event?: string; id?: string | number }>;

export function useRoutes(params?: {
  route_status?: string;
  courier_id?: string;
}) {
  const [routes, setRoutes] = useState<RouteListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const searchParams = new URLSearchParams();
      if (params?.route_status) searchParams.set("route_status", params.route_status);
      if (params?.courier_id) searchParams.set("courier_id", params.courier_id);
      const q = searchParams.toString();
      const data = await apiGet<RouteListResponse>(`/routes${q ? `?${q}` : ""}`);
      setRoutes(data.routes ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      setError(apiError.message ?? "Ошибка загрузки маршрутов");
      setRoutes([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [params?.route_status, params?.courier_id]);

  useEffect(() => {
    fetchRoutes();

    const handleRealTime = (e: Event) => {
      const realtimeEvent = e as RealtimeUpdateEvent;
      const event = realtimeEvent.detail?.event;
      if (event && event.startsWith("route_")) {
        fetchRoutes();
      }
    };
    window.addEventListener("realtime-update", handleRealTime);
    return () => window.removeEventListener("realtime-update", handleRealTime);
  }, [fetchRoutes]);

  const createRoute = useCallback(async (data: RouteCreate): Promise<Route> => {
    const created = await apiPost<Route>("/routes", data);
    await fetchRoutes();
    return created;
  }, [fetchRoutes]);

  const startRoute = useCallback(async (id: string): Promise<Route> => {
    const started = await apiPost<Route>(`/routes/${id}/start`, {});
    await fetchRoutes();
    return started;
  }, [fetchRoutes]);

  const cancelRoute = useCallback(async (id: string): Promise<void> => {
    await apiDel(`/routes/${id}`);
    setRoutes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const updateRoute = useCallback(async (id: string, data: RouteUpdate): Promise<Route> => {
    const updated = await apiPatch<Route>(`/routes/${id}`, data);
    await fetchRoutes();
    return updated;
  }, [fetchRoutes]);

  return {
    routes,
    total,
    loading,
    error,
    refetch: fetchRoutes,
    createRoute,
    startRoute,
    cancelRoute,
    updateRoute,
  };
}

export function useRoute(id: string | null) {
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoute = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiGet<Route>(`/routes/${id}`);
      setRoute(data);
    } catch (err) {
      const apiError = err as Partial<ApiError>;
      setError(apiError.message ?? "Маршрут не найден");
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRoute();

    const handleRealTime = (e: Event) => {
      const realtimeEvent = e as RealtimeUpdateEvent;
      const event = realtimeEvent.detail?.event;
      const eventId = realtimeEvent.detail?.id;
      if (event && event.startsWith("route_") && eventId === id) {
        fetchRoute();
      }
    };
    window.addEventListener("realtime-update", handleRealTime);
    return () => window.removeEventListener("realtime-update", handleRealTime);
  }, [fetchRoute, id]);

  return { route, loading, error, refetch: fetchRoute };
}
