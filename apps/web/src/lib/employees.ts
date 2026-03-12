import { api } from "@/lib/api-client";
import type { Empleado, EmpleadoBranch } from "@nexora/shared/types";
import type { EmpleadoInput } from "@nexora/shared/schemas";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ListEmpleadosParams {
  page?: number;
  pageSize?: number;
  search?: string;
  rol?: string;
  estado?: string;
  sucursal_id?: string;
}

export const empleadosApi = {
  list: ({
    page = 1,
    pageSize = 20,
    search,
    rol,
    estado,
    sucursal_id,
  }: ListEmpleadosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (rol) params.set("rol", rol);
    if (estado) params.set("estado", estado);
    if (sucursal_id) params.set("sucursal_id", sucursal_id);
    return api.getWithMeta<Empleado[]>(`/api/v1/empleados?${params}`);
  },
  get: (id: string) => api.get<Empleado>(`/api/v1/empleados/${id}`),
  create: (data: EmpleadoInput) =>
    api.post<Empleado>("/api/v1/empleados", data),
  update: (id: string, data: EmpleadoInput) =>
    api.put<Empleado>(`/api/v1/empleados/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/empleados/${id}`),
  listBranches: (id: string) =>
    api.get<EmpleadoBranch[]>(`/api/v1/empleados/${id}/sucursales`),
  assignBranches: (id: string, branchIds: string[]) =>
    api.put(`/api/v1/empleados/${id}/sucursales`, { branch_ids: branchIds }),
  regenerateAccessCode: (id: string) =>
    api.post<Empleado>(`/api/v1/empleados/${id}/regenerar-codigo`, {}),
  exportCsv: async (params?: ListEmpleadosParams) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set("search", params.search);
    if (params?.rol) searchParams.set("rol", params.rol);
    if (params?.estado) searchParams.set("estado", params.estado);
    if (params?.sucursal_id) searchParams.set("sucursal_id", params.sucursal_id);
    const res = await fetch(
      `${API_URL}/api/v1/empleados/export/csv?${searchParams}`,
      { credentials: "include" },
    );
    if (!res.ok) throw new Error("Error al exportar CSV");
    return res.blob();
  },
  bulkUpdateEstado: (ids: string[], estado: string) =>
    api.put("/api/v1/empleados/bulk/estado", { ids, estado }),
  bulkUpdateRol: (ids: string[], rol: string) =>
    api.put("/api/v1/empleados/bulk/rol", { ids, rol }),
  bulkAssignBranches: (ids: string[], branchIds: string[]) =>
    api.put("/api/v1/empleados/bulk/sucursales", {
      ids,
      branch_ids: branchIds,
    }),
};
