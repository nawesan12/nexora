import { api } from "@/lib/api-client";
import type { Promocion } from "@pronto/shared/types";

interface ListPromocionesParams {
  page?: number;
  pageSize?: number;
}

export const promocionesApi = {
  list: ({ page = 1, pageSize = 20 }: ListPromocionesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Promocion[]>(`/api/v1/promociones?${params}`);
  },
  get: (id: string) => api.get<Promocion>(`/api/v1/promociones/${id}`),
  create: (data: unknown) =>
    api.post<Promocion>("/api/v1/promociones", data),
  update: (id: string, data: unknown) =>
    api.put<Promocion>(`/api/v1/promociones/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/promociones/${id}`),
};
