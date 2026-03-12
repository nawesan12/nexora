import { api } from "@/lib/api-client";
import type {
  SalesReport,
  PurchasesReport,
  InventoryReport,
  FinanceReport,
  ProductReport,
} from "@nexora/shared/types";

interface ReportParams {
  desde?: string;
  hasta?: string;
  sucursal_id?: string;
}

function buildParams(params: ReportParams): string {
  const sp = new URLSearchParams();
  if (params.desde) sp.set("desde", params.desde);
  if (params.hasta) sp.set("hasta", params.hasta);
  if (params.sucursal_id) sp.set("sucursal_id", params.sucursal_id);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export const reportsApi = {
  sales: (params: ReportParams = {}) =>
    api.get<SalesReport>(`/api/v1/reportes/ventas${buildParams(params)}`),
  purchases: (params: ReportParams = {}) =>
    api.get<PurchasesReport>(`/api/v1/reportes/compras${buildParams(params)}`),
  inventory: (params: ReportParams = {}) =>
    api.get<InventoryReport>(`/api/v1/reportes/inventario${buildParams(params)}`),
  finance: (params: ReportParams = {}) =>
    api.get<FinanceReport>(`/api/v1/reportes/finanzas${buildParams(params)}`),
  products: (params: ReportParams = {}) =>
    api.get<ProductReport>(`/api/v1/reportes/productos${buildParams(params)}`),
  exportSales: (params: ReportParams = {}) =>
    `/api/v1/reportes/ventas/exportar${buildParams(params)}`,
  exportPurchases: (params: ReportParams = {}) =>
    `/api/v1/reportes/compras/exportar${buildParams(params)}`,
  exportInventory: (params: ReportParams = {}) =>
    `/api/v1/reportes/inventario/exportar${buildParams(params)}`,
  exportFinance: (params: ReportParams = {}) =>
    `/api/v1/reportes/finanzas/exportar${buildParams(params)}`,
};
