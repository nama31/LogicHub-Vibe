"use client";
/* eslint-disable react-hooks/preserve-manual-memoization, react-hooks/set-state-in-effect */

import { useState, useEffect, useCallback } from "react";
import { apiGet } from "@/lib/api";
import type { Summary, ProfitOut, CourierStat, ProductMargin, TrendItem, FailedReason } from "@/types/analytics";
import type { ApiError } from "@/types/api";

import { useAuth } from "@/hooks/useAuth";

export function useAnalytics(params?: { from?: string; to?: string }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profit, setProfit] = useState<ProfitOut | null>(null);
  
  // Phase 15 state
  const [couriers, setCouriers] = useState<CourierStat[]>([]);
  const [products, setProducts] = useState<ProductMargin[]>([]);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [failures, setFailures] = useState<FailedReason[]>([]);
  
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const fetchSummary = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiGet<Summary>("/analytics/summary");
      setSummary(data);
    } catch (err) {
      const apiError = err as Partial<ApiError> & { detail?: string };
      if (apiError.detail !== "Admin privileges required") {
        console.error("Failed to fetch summary:", err);
      }
    }
  }, [isAdmin]);

  const fetchProfit = useCallback(async () => {
    if (!isAdmin) return;
    try {
      let url = "/analytics/profit";
      const q = new URLSearchParams();
      if (params?.from) q.set("from", params.from);
      if (params?.to) q.set("to", params.to);
      const queryString = q.toString();
      if (queryString) url += `?${queryString}`;

      const data = await apiGet<ProfitOut>(url);
      setProfit(data);
    } catch (err) {
      const apiError = err as Partial<ApiError> & { detail?: string };
      if (apiError.detail !== "Admin privileges required") {
        console.error("Failed to fetch profit:", err);
      }
    }
  }, [params?.from, params?.to, isAdmin]);
  
  const fetchDeepAnalytics = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const [cData, pData, tData, fData] = await Promise.all([
        apiGet<{ couriers: CourierStat[] }>("/analytics/couriers"),
        apiGet<{ products: ProductMargin[] }>("/analytics/products"),
        apiGet<{ trends: TrendItem[] }>("/analytics/trends"),
        apiGet<{ failures: FailedReason[] }>("/analytics/failed"),
      ]);
      setCouriers(cData.couriers);
      setProducts(pData.products);
      setTrends(tData.trends);
      setFailures(fData.failures);
    } catch (err) {
      const apiError = err as Partial<ApiError> & { detail?: string };
      if (apiError.detail !== "Admin privileges required") {
        console.error("Failed to fetch deep analytics:", err);
      }
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchProfit(), fetchDeepAnalytics()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchSummary, fetchProfit, fetchDeepAnalytics, isAdmin]);

  return {
    summary,
    profit,
    couriers,
    products,
    trends,
    failures,
    loading,
    refetchSummary: fetchSummary,
    refetchProfit: fetchProfit,
    refetchDeep: fetchDeepAnalytics,
  };
}
