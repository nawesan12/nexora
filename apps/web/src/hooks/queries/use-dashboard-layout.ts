"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userSettingsApi, type DashboardLayout } from "@/lib/user-settings";

export function useDashboardLayout() {
  return useQuery({
    queryKey: ["dashboard-layout"],
    queryFn: () => userSettingsApi.getDashboardLayout(),
    staleTime: 10 * 60 * 1000,
    retry: false,
  });
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (layout: DashboardLayout) =>
      userSettingsApi.saveDashboardLayout(layout),
    onSuccess: (_data, variables) => {
      queryClient.setQueryData(["dashboard-layout"], variables);
    },
  });
}
