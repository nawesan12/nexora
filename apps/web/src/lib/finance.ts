import { api } from "@/lib/api-client";
import type {
  Caja, MovimientoCaja, ArqueoCaja, Cheque, EntidadBancaria,
  MetodoPago, Gasto, GastoRecurrente, Presupuesto,
  ConfiguracionComision, ComisionVendedor, FinanceResumen,
} from "@nexora/shared/types";
import type {
  CajaInput, MovimientoInput, ArqueoInput, ChequeInput,
  TransicionChequeInput, GastoInput, GastoRecurrenteInput,
  MetodoPagoInput, PresupuestoInput, ConfiguracionComisionInput,
  EntidadBancariaInput,
} from "@nexora/shared/schemas";

// --- Cajas ---

interface ListCajasParams {
  page?: number;
  pageSize?: number;
}

export const cajasApi = {
  list: ({ page = 1, pageSize = 20 }: ListCajasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Caja[]>(`/api/v1/finanzas/cajas?${params}`);
  },
  get: (id: string) => api.get<Caja>(`/api/v1/finanzas/cajas/${id}`),
  create: (data: CajaInput) =>
    api.post<Caja>("/api/v1/finanzas/cajas", data),
  update: (id: string, data: CajaInput) =>
    api.put<Caja>(`/api/v1/finanzas/cajas/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/finanzas/cajas/${id}`),
};

// --- Movimientos ---

interface ListMovimientosParams {
  cajaId: string;
  page?: number;
  pageSize?: number;
}

export const movimientosApi = {
  listByCaja: ({ cajaId, page = 1, pageSize = 20 }: ListMovimientosParams) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<MovimientoCaja[]>(
      `/api/v1/finanzas/cajas/${cajaId}/movimientos?${params}`,
    );
  },
  create: (cajaId: string, data: MovimientoInput) =>
    api.post<MovimientoCaja>(
      `/api/v1/finanzas/cajas/${cajaId}/movimientos`,
      data,
    ),
};

// --- Arqueos ---

interface ListArqueosParams {
  cajaId: string;
  page?: number;
  pageSize?: number;
}

export const arqueosApi = {
  listByCaja: ({ cajaId, page = 1, pageSize = 20 }: ListArqueosParams) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<ArqueoCaja[]>(
      `/api/v1/finanzas/cajas/${cajaId}/arqueos?${params}`,
    );
  },
  create: (cajaId: string, data: ArqueoInput) =>
    api.post<ArqueoCaja>(
      `/api/v1/finanzas/cajas/${cajaId}/arqueos`,
      data,
    ),
  updateEstado: (cajaId: string, arqueoId: string, estado: string) =>
    api.patch<ArqueoCaja>(
      `/api/v1/finanzas/cajas/${cajaId}/arqueos/${arqueoId}`,
      { estado },
    ),
};

// --- Cheques ---

interface ListChequesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
}

export const chequesApi = {
  list: ({ page = 1, pageSize = 20, search, estado }: ListChequesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (estado) params.set("estado", estado);
    return api.getWithMeta<Cheque[]>(`/api/v1/finanzas/cheques?${params}`);
  },
  get: (id: string) => api.get<Cheque>(`/api/v1/finanzas/cheques/${id}`),
  create: (data: ChequeInput) =>
    api.post<Cheque>("/api/v1/finanzas/cheques", data),
  update: (id: string, data: ChequeInput) =>
    api.put<Cheque>(`/api/v1/finanzas/cheques/${id}`, data),
  updateEstado: (id: string, data: TransicionChequeInput) =>
    api.patch<Cheque>(`/api/v1/finanzas/cheques/${id}/estado`, data),
};

// --- Gastos ---

interface ListGastosParams {
  page?: number;
  pageSize?: number;
  categoria?: string;
}

export const gastosApi = {
  list: ({ page = 1, pageSize = 20, categoria }: ListGastosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (categoria) params.set("categoria", categoria);
    return api.getWithMeta<Gasto[]>(`/api/v1/finanzas/gastos?${params}`);
  },
  get: (id: string) => api.get<Gasto>(`/api/v1/finanzas/gastos/${id}`),
  create: (data: GastoInput) =>
    api.post<Gasto>("/api/v1/finanzas/gastos", data),
  update: (id: string, data: GastoInput) =>
    api.put<Gasto>(`/api/v1/finanzas/gastos/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/finanzas/gastos/${id}`),
};

// --- Gastos Recurrentes ---

interface ListGastosRecurrentesParams {
  page?: number;
  pageSize?: number;
}

export const gastosRecurrentesApi = {
  list: ({ page = 1, pageSize = 20 }: ListGastosRecurrentesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<GastoRecurrente[]>(
      `/api/v1/finanzas/gastos/recurrentes?${params}`,
    );
  },
  get: (id: string) =>
    api.get<GastoRecurrente>(`/api/v1/finanzas/gastos/recurrentes/${id}`),
  create: (data: GastoRecurrenteInput) =>
    api.post<GastoRecurrente>("/api/v1/finanzas/gastos/recurrentes", data),
  update: (id: string, data: GastoRecurrenteInput) =>
    api.put<GastoRecurrente>(`/api/v1/finanzas/gastos/recurrentes/${id}`, data),
  delete: (id: string) =>
    api.del(`/api/v1/finanzas/gastos/recurrentes/${id}`),
};

// --- Métodos de Pago ---

interface ListMetodosPagoParams {
  page?: number;
  pageSize?: number;
}

export const metodosPagoApi = {
  list: ({ page = 1, pageSize = 20 }: ListMetodosPagoParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<MetodoPago[]>(
      `/api/v1/finanzas/metodos-pago?${params}`,
    );
  },
  get: (id: string) =>
    api.get<MetodoPago>(`/api/v1/finanzas/metodos-pago/${id}`),
  create: (data: MetodoPagoInput) =>
    api.post<MetodoPago>("/api/v1/finanzas/metodos-pago", data),
  update: (id: string, data: MetodoPagoInput) =>
    api.put<MetodoPago>(`/api/v1/finanzas/metodos-pago/${id}`, data),
  delete: (id: string) =>
    api.del(`/api/v1/finanzas/metodos-pago/${id}`),
};

// --- Presupuestos ---

interface ListPresupuestosParams {
  page?: number;
  pageSize?: number;
  estado?: string;
}

export const presupuestosApi = {
  list: ({ page = 1, pageSize = 20, estado }: ListPresupuestosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (estado) params.set("estado", estado);
    return api.getWithMeta<Presupuesto[]>(
      `/api/v1/finanzas/presupuestos?${params}`,
    );
  },
  get: (id: string) =>
    api.get<Presupuesto>(`/api/v1/finanzas/presupuestos/${id}`),
  create: (data: PresupuestoInput) =>
    api.post<Presupuesto>("/api/v1/finanzas/presupuestos", data),
  update: (id: string, data: PresupuestoInput) =>
    api.put<Presupuesto>(`/api/v1/finanzas/presupuestos/${id}`, data),
  delete: (id: string) =>
    api.del(`/api/v1/finanzas/presupuestos/${id}`),
};

// --- Comisiones ---

interface ListComisionesParams {
  page?: number;
  pageSize?: number;
  empleadoId?: string;
}

export const comisionesApi = {
  listConfig: ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<ConfiguracionComision[]>(
      `/api/v1/finanzas/comisiones/config?${params}`,
    );
  },
  getConfig: (id: string) =>
    api.get<ConfiguracionComision>(`/api/v1/finanzas/comisiones/config/${id}`),
  createConfig: (data: ConfiguracionComisionInput) =>
    api.post<ConfiguracionComision>(
      "/api/v1/finanzas/comisiones/config",
      data,
    ),
  updateConfig: (id: string, data: ConfiguracionComisionInput) =>
    api.put<ConfiguracionComision>(
      `/api/v1/finanzas/comisiones/config/${id}`,
      data,
    ),
  deleteConfig: (id: string) =>
    api.del(`/api/v1/finanzas/comisiones/config/${id}`),
  listComisiones: ({
    page = 1,
    pageSize = 20,
    empleadoId,
  }: ListComisionesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (empleadoId) params.set("empleado_id", empleadoId);
    return api.getWithMeta<ComisionVendedor[]>(
      `/api/v1/finanzas/comisiones?${params}`,
    );
  },
  createComision: (data: { empleado_id: string; pedido_id: string; monto: number }) =>
    api.post<ComisionVendedor>("/api/v1/finanzas/comisiones", data),
};

// --- Entidades Bancarias ---

interface ListEntidadesBancariasParams {
  page?: number;
  pageSize?: number;
}

export const entidadesBancariasApi = {
  list: ({ page = 1, pageSize = 20 }: ListEntidadesBancariasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<EntidadBancaria[]>(
      `/api/v1/finanzas/entidades-bancarias?${params}`,
    );
  },
  get: (id: string) =>
    api.get<EntidadBancaria>(`/api/v1/finanzas/entidades-bancarias/${id}`),
  create: (data: EntidadBancariaInput) =>
    api.post<EntidadBancaria>("/api/v1/finanzas/entidades-bancarias", data),
  update: (id: string, data: EntidadBancariaInput) =>
    api.put<EntidadBancaria>(
      `/api/v1/finanzas/entidades-bancarias/${id}`,
      data,
    ),
  delete: (id: string) =>
    api.del(`/api/v1/finanzas/entidades-bancarias/${id}`),
};

// --- Resumen Financiero ---

export const financeResumenApi = {
  get: () => api.get<FinanceResumen>("/api/v1/finanzas/resumen"),
};
