import { api } from "./api-client";

export interface DashboardLayout {
  layouts: Record<string, Array<{ i: string; x: number; y: number; w: number; h: number }>>;
}

export const userSettingsApi = {
  getDashboardLayout: () =>
    api.get<DashboardLayout>("/api/v1/configuracion/usuario/dashboard-layout"),
  saveDashboardLayout: (layout: DashboardLayout) =>
    api.put<void>("/api/v1/configuracion/usuario/dashboard-layout", layout),
};
