import { api } from "@/lib/api-client";
import type { Retencion } from "@pronto/shared/types";
import type { RetencionInput } from "@pronto/shared/schemas";

interface ListRetencionesParams {
  page?: number;
  pageSize?: number;
  tipo?: string;
  entidad_tipo?: string;
  periodo?: string;
}

export const retencionesApi = {
  list: ({ page = 1, pageSize = 20, tipo, entidad_tipo, periodo }: ListRetencionesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (tipo) params.set("tipo", tipo);
    if (entidad_tipo) params.set("entidad_tipo", entidad_tipo);
    if (periodo) params.set("periodo", periodo);
    return api.getWithMeta<Retencion[]>(`/api/v1/finanzas/retenciones?${params}`);
  },
  get: (id: string) => api.get<Retencion>(`/api/v1/finanzas/retenciones/${id}`),
  create: (data: RetencionInput) =>
    api.post<Retencion>("/api/v1/finanzas/retenciones", data),
  anular: (id: string) =>
    api.patch<Retencion>(`/api/v1/finanzas/retenciones/${id}/anular`),
  delete: (id: string) => api.del(`/api/v1/finanzas/retenciones/${id}`),
};
