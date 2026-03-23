import { api } from "@/lib/api-client";
import type {
  Pago, PagoDetail, AgingBucket, ComprobanteConDeuda, ClienteBalance,
  PagoProveedor, PagoProveedorDetail,
} from "@pronto/shared/types";
import type { PagoInput, PagoProveedorInput, LimiteCreditoInput } from "@pronto/shared/schemas";

interface ListPagosParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

// --- Accounts Receivable ---

export const pagosApi = {
  list: ({ page = 1, pageSize = 20, search }: ListPagosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    return api.getWithMeta<Pago[]>(`/api/v1/finanzas/pagos?${params}`);
  },
  get: (id: string) => api.get<PagoDetail>(`/api/v1/finanzas/pagos/${id}`),
  create: (data: PagoInput) =>
    api.post<PagoDetail>("/api/v1/finanzas/pagos", data),
  anular: (id: string) =>
    api.patch<PagoDetail>(`/api/v1/finanzas/pagos/${id}/anular`),
  getAgingReport: () =>
    api.get<AgingBucket[]>("/api/v1/finanzas/pagos/aging"),
  listComprobantesConDeuda: ({ page = 1, pageSize = 50, clienteId }: { page?: number; pageSize?: number; clienteId?: string } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (clienteId) params.set("cliente_id", clienteId);
    return api.getWithMeta<ComprobanteConDeuda[]>(`/api/v1/finanzas/comprobantes-con-deuda?${params}`);
  },
  getClienteBalance: (clienteId: string) =>
    api.get<ClienteBalance>(`/api/v1/clientes/${clienteId}/saldo`),
  updateLimiteCredito: (clienteId: string, data: LimiteCreditoInput) =>
    api.put<ClienteBalance>(`/api/v1/clientes/${clienteId}/limite-credito`, data),
};

// --- Accounts Payable ---

interface ListPagosProveedorParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const pagosProveedorApi = {
  list: ({ page = 1, pageSize = 20, search }: ListPagosProveedorParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    return api.getWithMeta<PagoProveedor[]>(`/api/v1/finanzas/pagos-proveedor?${params}`);
  },
  get: (id: string) => api.get<PagoProveedorDetail>(`/api/v1/finanzas/pagos-proveedor/${id}`),
  create: (data: PagoProveedorInput) =>
    api.post<PagoProveedorDetail>("/api/v1/finanzas/pagos-proveedor", data),
  anular: (id: string) =>
    api.patch<PagoProveedorDetail>(`/api/v1/finanzas/pagos-proveedor/${id}/anular`),
};
