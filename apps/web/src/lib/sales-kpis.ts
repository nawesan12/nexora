import { api } from "@/lib/api-client";
import type { SalesKPIData } from "@pronto/shared/types";

export const salesKpisApi = {
  get: () => api.get<SalesKPIData>("/api/v1/ventas/kpis"),
};
