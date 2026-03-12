import { api } from "@/lib/api-client";
import type {
  PedidoList,
  PedidoDetail,
  HistorialPedido,
  ConfiguracionImpuesto,
} from "@nexora/shared/types";
import type {
  PedidoInput,
  TransicionEstadoInput,
  ConfiguracionImpuestoInput,
} from "@nexora/shared/schemas";

interface ListPedidosParams {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
}

export const pedidosApi = {
  list: ({ page = 1, pageSize = 20, search, estado }: ListPedidosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (estado) params.set("estado", estado);
    return api.getWithMeta<PedidoList[]>(`/api/v1/pedidos?${params}`);
  },
  get: (id: string) => api.get<PedidoDetail>(`/api/v1/pedidos/${id}`),
  create: (data: PedidoInput) => api.post<PedidoDetail>("/api/v1/pedidos", data),
  update: (id: string, data: PedidoInput) =>
    api.put<PedidoDetail>(`/api/v1/pedidos/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/pedidos/${id}`),
  transition: (id: string, data: TransicionEstadoInput) =>
    api.patch<PedidoDetail>(`/api/v1/pedidos/${id}/estado`, data),
  historial: (id: string) =>
    api.get<HistorialPedido[]>(`/api/v1/pedidos/${id}/historial`),
};

export const configImpuestosApi = {
  list: () => api.get<ConfiguracionImpuesto[]>("/api/v1/configuracion/impuestos"),
  create: (data: ConfiguracionImpuestoInput) =>
    api.post<ConfiguracionImpuesto>("/api/v1/configuracion/impuestos", data),
  update: (id: string, data: ConfiguracionImpuestoInput) =>
    api.put<ConfiguracionImpuesto>(`/api/v1/configuracion/impuestos/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/configuracion/impuestos/${id}`),
};
