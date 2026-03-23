import { api } from "@/lib/api-client";
import type { RemitoList, RemitoDetail } from "@pronto/shared/types";
import type { RemitoFromPedidoInput } from "@pronto/shared/schemas";

interface ListRemitosParams {
  page?: number;
  pageSize?: number;
  estado?: string;
}

export const remitosApi = {
  list: ({ page = 1, pageSize = 20, estado }: ListRemitosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (estado) params.set("estado", estado);
    return api.getWithMeta<RemitoList[]>(`/api/v1/remitos?${params}`);
  },
  get: (id: string) => api.get<RemitoDetail>(`/api/v1/remitos/${id}`),
  createFromPedido: (data: RemitoFromPedidoInput) =>
    api.post<RemitoDetail>("/api/v1/remitos/from-pedido", data),
  emitir: (id: string) => api.patch<RemitoDetail>(`/api/v1/remitos/${id}/emitir`),
  entregar: (id: string, data?: { firma_url?: string }) =>
    api.patch<RemitoDetail>(`/api/v1/remitos/${id}/entregar`, data),
  anular: (id: string) => api.patch<RemitoDetail>(`/api/v1/remitos/${id}/anular`),
  delete: (id: string) => api.del(`/api/v1/remitos/${id}`),
};
