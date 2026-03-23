import { api } from "@/lib/api-client";
import type { SalidaVendedor } from "@pronto/shared/types";
import type { RegistrarSalidaInput, RegistrarRegresoInput } from "@pronto/shared/schemas";

interface ListSalidasParams {
  page?: number;
  pageSize?: number;
  fecha?: string;
  empleado_id?: string;
}

export const salidasVendedorApi = {
  list: ({ page = 1, pageSize = 20, fecha, empleado_id }: ListSalidasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (fecha) params.set("fecha", fecha);
    if (empleado_id) params.set("empleado_id", empleado_id);
    return api.getWithMeta<SalidaVendedor[]>(`/api/v1/salidas-vendedor?${params}`);
  },
  get: (id: string) => api.get<SalidaVendedor>(`/api/v1/salidas-vendedor/${id}`),
  registrarSalida: (data: RegistrarSalidaInput) =>
    api.post<SalidaVendedor>("/api/v1/salidas-vendedor", data),
  registrarRegreso: (id: string, data: RegistrarRegresoInput) =>
    api.patch<SalidaVendedor>(`/api/v1/salidas-vendedor/${id}/regreso`, data),
  delete: (id: string) => api.del(`/api/v1/salidas-vendedor/${id}`),
};
