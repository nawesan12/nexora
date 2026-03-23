import { api } from "@/lib/api-client";
import type { MetaVenta } from "@pronto/shared/types";
import type { MetaVentaInput } from "@pronto/shared/schemas";

interface ListMetasVentaParams {
  page?: number;
  pageSize?: number;
}

export const metasVentaApi = {
  list: ({ page = 1, pageSize = 20 }: ListMetasVentaParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<MetaVenta[]>(`/api/v1/metas-venta?${params}`);
  },
  get: (id: string) => api.get<MetaVenta>(`/api/v1/metas-venta/${id}`),
  create: (data: MetaVentaInput) =>
    api.post<MetaVenta>("/api/v1/metas-venta", data),
  update: (id: string, data: MetaVentaInput) =>
    api.put<MetaVenta>(`/api/v1/metas-venta/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/metas-venta/${id}`),
};
