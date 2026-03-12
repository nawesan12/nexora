import { api } from "@/lib/api-client";
import type { Proveedor } from "@nexora/shared/types";

interface ListProveedoresParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const proveedoresApi = {
  list: ({ page = 1, pageSize = 20, search }: ListProveedoresParams = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    return api.getWithMeta<Proveedor[]>(`/api/v1/proveedores?${params}`);
  },
  get: (id: string) => api.get<Proveedor>(`/api/v1/proveedores/${id}`),
  create: (data: import("@nexora/shared/schemas").ProveedorInput) =>
    api.post<Proveedor>("/api/v1/proveedores", data),
  update: (id: string, data: import("@nexora/shared/schemas").ProveedorInput) =>
    api.put<Proveedor>(`/api/v1/proveedores/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/proveedores/${id}`),
};
