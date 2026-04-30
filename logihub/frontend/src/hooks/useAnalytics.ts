"use client";

import { useState, useEffect, useCallback } from "react";
import { apiGet } from "@/lib/api";
import type { Summary, ProfitOut } from "@/types/analytics";

import { useAuth } from "@/hooks/useAuth";

export function useAnalytics(params?: { from?: string; to?: string }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [profit, setProfit] = useState<ProfitOut | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === "admin";

  const fetchSummary = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await apiGet<Summary>("/analytics/summary");
      setSummary(data);
    } catch (err: any) {
      if (err?.detail !== "Admin privileges required") {
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
    } catch (err: any) {
      if (err?.detail !== "Admin privileges required") {
        console.error("Failed to fetch profit:", err);
      }
    }
  }, [params?.from, params?.to, isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchSummary(), fetchProfit()]);
      setLoading(false);
    };
    loadAll();
  }, [fetchSummary, fetchProfit, isAdmin]);

  return {
    summary,
    profit,
    loading,
    refetchSummary: fetchSummary,
    refetchProfit: fetchProfit,
  };
}
