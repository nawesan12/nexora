import { api } from "@/lib/api-client";
import type { Branch } from "@nexora/shared/types";
import type { SucursalInput } from "@nexora/shared/schemas";

export const branchesApi = {
  list: () => api.getWithMeta<Branch[]>("/api/v1/configuracion/sucursales"),
  get: (id: string) => api.get<Branch>(`/api/v1/configuracion/sucursales/${id}`),
  create: (data: SucursalInput) =>
    api.post<Branch>("/api/v1/configuracion/sucursales", data),
  update: (id: string, data: SucursalInput) =>
    api.put<Branch>(`/api/v1/configuracion/sucursales/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/configuracion/sucursales/${id}`),
};
