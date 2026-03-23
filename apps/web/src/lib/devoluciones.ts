import { api } from "@/lib/api-client";
import type { DevolucionList, DevolucionDetail } from "@pronto/shared/types";
import type { DevolucionInput } from "@pronto/shared/schemas";

interface ListDevolucionesParams {
  page?: number;
  pageSize?: number;
}

export const devolucionesApi = {
  list: ({ page = 1, pageSize = 20 }: ListDevolucionesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<DevolucionList[]>(`/api/v1/inventario/devoluciones?${params}`);
  },
  get: (id: string) => api.get<DevolucionDetail>(`/api/v1/inventario/devoluciones/${id}`),
  create: (data: DevolucionInput) =>
    api.post<DevolucionDetail>("/api/v1/inventario/devoluciones", data),
  approve: (id: string) =>
    api.patch<DevolucionDetail>(`/api/v1/inventario/devoluciones/${id}/aprobar`),
  reject: (id: string) =>
    api.patch<DevolucionDetail>(`/api/v1/inventario/devoluciones/${id}/rechazar`),
  delete: (id: string) => api.del(`/api/v1/inventario/devoluciones/${id}`),
};
