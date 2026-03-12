import { api } from "@/lib/api-client";
import type { OrdenCompraList, OrdenCompraDetail } from "@nexora/shared/types";
import type { OrdenCompraInput, ReceiveInput } from "@nexora/shared/schemas";

interface ListComprasParams {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
}

export const comprasApi = {
  list: ({ page = 1, pageSize = 20, search, estado }: ListComprasParams = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    if (estado) params.set("estado", estado);
    return api.getWithMeta<OrdenCompraList[]>(`/api/v1/compras?${params}`);
  },
  get: (id: string) => api.get<OrdenCompraDetail>(`/api/v1/compras/${id}`),
  create: (data: OrdenCompraInput) =>
    api.post<OrdenCompraDetail>("/api/v1/compras", data),
  update: (id: string, data: OrdenCompraInput) =>
    api.put<OrdenCompraDetail>(`/api/v1/compras/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/compras/${id}`),
  approve: (id: string, data?: { comentario?: string }) =>
    api.patch<OrdenCompraDetail>(`/api/v1/compras/${id}/aprobar`, data),
  receive: (id: string, data: ReceiveInput) =>
    api.patch<OrdenCompraDetail>(`/api/v1/compras/${id}/recibir`, data),
  cancel: (id: string, data?: { comentario?: string }) =>
    api.patch<OrdenCompraDetail>(`/api/v1/compras/${id}/cancelar`, data),
  historial: (id: string) =>
    api.get<import("@nexora/shared/types").HistorialOrdenCompra[]>(`/api/v1/compras/${id}/historial`),
};
