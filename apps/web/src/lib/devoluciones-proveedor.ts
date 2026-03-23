import { api } from "@/lib/api-client";
import type {
  DevolucionProveedorList,
  DevolucionProveedorDetail,
} from "@pronto/shared/types";
import type { DevolucionProveedorInput } from "@pronto/shared/schemas";

interface ListDevolucionesProveedorParams {
  page?: number;
  pageSize?: number;
}

export const devolucionesProveedorApi = {
  list: ({
    page = 1,
    pageSize = 20,
  }: ListDevolucionesProveedorParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<DevolucionProveedorList[]>(
      `/api/v1/compras/devoluciones?${params}`,
    );
  },
  get: (id: string) =>
    api.get<DevolucionProveedorDetail>(`/api/v1/compras/devoluciones/${id}`),
  create: (data: DevolucionProveedorInput) =>
    api.post<DevolucionProveedorDetail>("/api/v1/compras/devoluciones", data),
  transition: (id: string, estado: string) =>
    api.patch<DevolucionProveedorDetail>(
      `/api/v1/compras/devoluciones/${id}/estado`,
      { estado },
    ),
  delete: (id: string) => api.del(`/api/v1/compras/devoluciones/${id}`),
};
