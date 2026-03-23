import { api } from "@/lib/api-client";
import type {
  FacturaProveedorList,
  FacturaProveedorDetail,
} from "@pronto/shared/types";
import type { FacturaProveedorInput } from "@pronto/shared/schemas";

interface ListFacturasProveedorParams {
  page?: number;
  pageSize?: number;
}

export const facturasProveedorApi = {
  list: ({ page = 1, pageSize = 20 }: ListFacturasProveedorParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<FacturaProveedorList[]>(
      `/api/v1/compras/facturas?${params}`,
    );
  },
  get: (id: string) =>
    api.get<FacturaProveedorDetail>(`/api/v1/compras/facturas/${id}`),
  create: (data: FacturaProveedorInput) =>
    api.post<FacturaProveedorDetail>("/api/v1/compras/facturas", data),
  anular: (id: string) =>
    api.patch<FacturaProveedorDetail>(`/api/v1/compras/facturas/${id}/anular`),
  delete: (id: string) => api.del(`/api/v1/compras/facturas/${id}`),
};
