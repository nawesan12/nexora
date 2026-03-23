import { api } from "@/lib/api-client";
import type { RutaList, RutaDetail, RepartoDetail } from "@pronto/shared/types";

interface ListRutasParams {
  page?: number;
  pageSize?: number;
}

export const rutasApi = {
  list: ({ page = 1, pageSize = 20 }: ListRutasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<RutaList[]>(`/api/v1/logistica/rutas?${params}`);
  },
  get: (id: string) => api.get<RutaDetail>(`/api/v1/logistica/rutas/${id}`),
  create: (data: unknown) =>
    api.post<RutaDetail>("/api/v1/logistica/rutas", data),
  update: (id: string, data: unknown) =>
    api.put<RutaDetail>(`/api/v1/logistica/rutas/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/logistica/rutas/${id}`),
  generarReparto: (id: string, data: { fecha: string; empleado_id: string }) =>
    api.post<RepartoDetail>(
      `/api/v1/logistica/rutas/${id}/generar-reparto`,
      data,
    ),
};
