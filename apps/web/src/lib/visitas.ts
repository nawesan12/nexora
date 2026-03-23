import { api } from "@/lib/api-client";
import type { VisitaCliente } from "@pronto/shared/types";
import type { VisitaClienteInput } from "@pronto/shared/schemas";

interface ListVisitasParams {
  page?: number;
  pageSize?: number;
  vendedor_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  resultado?: string;
}

export const visitasApi = {
  list: ({
    page = 1,
    pageSize = 20,
    vendedor_id,
    fecha_desde,
    fecha_hasta,
    resultado,
  }: ListVisitasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (vendedor_id) params.set("vendedor_id", vendedor_id);
    if (fecha_desde) params.set("fecha_desde", fecha_desde);
    if (fecha_hasta) params.set("fecha_hasta", fecha_hasta);
    if (resultado) params.set("resultado", resultado);
    return api.getWithMeta<VisitaCliente[]>(`/api/v1/visitas?${params}`);
  },

  listToday: (vendedor_id: string) =>
    api.get<VisitaCliente[]>(`/api/v1/visitas/hoy?vendedor_id=${vendedor_id}`),

  get: (id: string) => api.get<VisitaCliente>(`/api/v1/visitas/${id}`),

  create: (data: VisitaClienteInput) =>
    api.post<VisitaCliente>("/api/v1/visitas", data),

  update: (id: string, data: Record<string, unknown>) =>
    api.put<VisitaCliente>(`/api/v1/visitas/${id}`, data),

  delete: (id: string) => api.del(`/api/v1/visitas/${id}`),
};
