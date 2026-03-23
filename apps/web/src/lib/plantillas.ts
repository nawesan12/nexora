import { api } from "@/lib/api-client";
import type {
  PlantillaPedidoList,
  PlantillaPedidoDetail,
} from "@pronto/shared/types";
import type { PlantillaPedidoInput } from "@pronto/shared/schemas";

interface ListPlantillasParams {
  page?: number;
  pageSize?: number;
}

export const plantillasApi = {
  list: ({ page = 1, pageSize = 20 }: ListPlantillasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<PlantillaPedidoList[]>(
      `/api/v1/plantillas-pedido?${params}`,
    );
  },
  get: (id: string) =>
    api.get<PlantillaPedidoDetail>(`/api/v1/plantillas-pedido/${id}`),
  create: (data: PlantillaPedidoInput) =>
    api.post<PlantillaPedidoDetail>("/api/v1/plantillas-pedido", data),
  update: (id: string, data: PlantillaPedidoInput) =>
    api.put<PlantillaPedidoDetail>(`/api/v1/plantillas-pedido/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/plantillas-pedido/${id}`),
  generar: (id: string) =>
    api.post<{ pedido_id: string }>(
      `/api/v1/plantillas-pedido/${id}/generar`,
    ),
};
