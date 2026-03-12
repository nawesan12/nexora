import { api } from "./api-client";
import type { DashboardStats } from "@nexora/shared/types";

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/api/v1/dashboard/stats"),
};
