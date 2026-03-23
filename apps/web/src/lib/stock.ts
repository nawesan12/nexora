import { api } from "@/lib/api-client";
import type { MovimientoStock, Meta } from "@pronto/shared/types";

interface ListMovimientosParams {
  page?: number;
  pageSize?: number;
  producto_id?: string;
  sucursal_id?: string;
  tipo?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
}

export const movimientosStockApi = {
  list: ({
    page = 1,
    pageSize = 20,
    producto_id,
    sucursal_id,
    tipo,
    fecha_desde,
    fecha_hasta,
  }: ListMovimientosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (producto_id) params.set("producto_id", producto_id);
    if (sucursal_id) params.set("sucursal_id", sucursal_id);
    if (tipo) params.set("tipo", tipo);
    if (fecha_desde) params.set("fecha_desde", fecha_desde);
    if (fecha_hasta) params.set("fecha_hasta", fecha_hasta);
    return api.getWithMeta<MovimientoStock[]>(
      `/api/v1/inventario/movimientos?${params}`,
    );
  },
  adjust: (data: {
    producto_id: string;
    sucursal_id: string;
    cantidad: number;
    tipo: string;
    motivo: string;
  }) =>
    api.post<MovimientoStock>("/api/v1/inventario/movimientos/ajuste", data),
};
