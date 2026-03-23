import { api } from "@/lib/api-client";
import type { ConvenioProveedor, ConvenioDetail } from "@pronto/shared/types";

interface ListConveniosParams {
  page?: number;
  pageSize?: number;
}

export interface ConvenioInput {
  proveedor_id: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo?: boolean;
  items: {
    producto_id: string;
    precio_convenido: number;
    cantidad_minima: number;
    descuento_porcentaje: number;
  }[];
}

export const conveniosApi = {
  list: ({ page = 1, pageSize = 20 }: ListConveniosParams = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return api.getWithMeta<ConvenioProveedor[]>(`/api/v1/proveedores/convenios?${params}`);
  },
  get: (id: string) => api.get<ConvenioDetail>(`/api/v1/proveedores/convenios/${id}`),
  create: (data: ConvenioInput) =>
    api.post<ConvenioDetail>("/api/v1/proveedores/convenios", data),
  update: (id: string, data: ConvenioInput) =>
    api.put<ConvenioDetail>(`/api/v1/proveedores/convenios/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/proveedores/convenios/${id}`),
};
