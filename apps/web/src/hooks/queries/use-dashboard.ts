"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/dashboard";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
    refetchInterval: 5 * 60 * 1000,
    staleTime: 2 * 60 * 1000,
  });
}
