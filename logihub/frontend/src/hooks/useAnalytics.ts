// GET /analytics/summary
// GET /analytics/profit?from=&to=&group_by=

import type { Summary, ProfitBreakdown } from "@/types/analytics";

export function useAnalytics() {
  // TODO: useSWR for /analytics/summary and /analytics/profit
  return {
    summary: null as Summary | null,
    profit: null as ProfitBreakdown | null,
    isLoading: true,
  };
}
