import { api } from "@/lib/api-client";
import type {
  TransferenciaList,
  TransferenciaDetail,
} from "@pronto/shared/types";

interface ListTransferenciasParams {
  page?: number;
  pageSize?: number;
  estado?: string;
}

export const transferenciasApi = {
  list: ({
    page = 1,
    pageSize = 20,
    estado,
  }: ListTransferenciasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (estado) params.set("estado", estado);
    return api.getWithMeta<TransferenciaList[]>(
      `/api/v1/inventario/transferencias?${params}`,
    );
  },
  get: (id: string) =>
    api.get<TransferenciaDetail>(`/api/v1/inventario/transferencias/${id}`),
  create: (data: unknown) =>
    api.post<TransferenciaDetail>("/api/v1/inventario/transferencias", data),
  transition: (
    id: string,
    data: {
      estado: string;
      observaciones?: string;
      items?: Array<{
        id: string;
        cantidad_enviada?: number;
        cantidad_recibida?: number;
      }>;
    },
  ) =>
    api.patch<TransferenciaDetail>(
      `/api/v1/inventario/transferencias/${id}/estado`,
      data,
    ),
  delete: (id: string) =>
    api.del(`/api/v1/inventario/transferencias/${id}`),
};
