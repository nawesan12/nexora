import { api } from "@/lib/api-client";
import type { MantenimientoVehiculo } from "@pronto/shared/types";
import type { MantenimientoVehiculoInput } from "@pronto/shared/schemas";

interface ListMantenimientosParams {
  page?: number;
  pageSize?: number;
  vehiculo_id?: string;
}

export const mantenimientosApi = {
  list: ({ page = 1, pageSize = 20, vehiculo_id }: ListMantenimientosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (vehiculo_id) params.set("vehiculo_id", vehiculo_id);
    return api.getWithMeta<MantenimientoVehiculo[]>(`/api/v1/logistica/mantenimientos?${params}`);
  },
  get: (id: string) => api.get<MantenimientoVehiculo>(`/api/v1/logistica/mantenimientos/${id}`),
  create: (data: MantenimientoVehiculoInput) =>
    api.post<MantenimientoVehiculo>("/api/v1/logistica/mantenimientos", data),
  update: (id: string, data: MantenimientoVehiculoInput) =>
    api.put<MantenimientoVehiculo>(`/api/v1/logistica/mantenimientos/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/logistica/mantenimientos/${id}`),
};
