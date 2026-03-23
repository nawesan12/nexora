import { api } from "@/lib/api-client";
import type {
  ExtractoBancario,
  ExtractoBancarioDetail,
  MovCajaParaConciliar,
} from "@pronto/shared/types";
import type {
  ExtractoInput,
  ImportarMovimientosInput,
  ConciliarInput,
} from "@pronto/shared/schemas";

interface ListExtractosParams {
  page?: number;
  pageSize?: number;
}

export const reconciliacionApi = {
  listExtractos: ({ page = 1, pageSize = 20 }: ListExtractosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<ExtractoBancario[]>(
      `/api/v1/finanzas/reconciliacion?${params}`,
    );
  },
  getExtracto: (id: string) =>
    api.get<ExtractoBancarioDetail>(
      `/api/v1/finanzas/reconciliacion/${id}`,
    ),
  createExtracto: (data: ExtractoInput) =>
    api.post<ExtractoBancario>("/api/v1/finanzas/reconciliacion", data),
  importMovimientos: (id: string, data: ImportarMovimientosInput) =>
    api.post<void>(
      `/api/v1/finanzas/reconciliacion/${id}/movimientos`,
      data,
    ),
  conciliar: (movId: string, data: ConciliarInput) =>
    api.patch<void>(
      `/api/v1/finanzas/reconciliacion/movimientos/${movId}/conciliar`,
      data,
    ),
  descartar: (movId: string) =>
    api.patch<void>(
      `/api/v1/finanzas/reconciliacion/movimientos/${movId}/descartar`,
    ),
  listMovCaja: (id: string, desde: string, hasta: string) => {
    const params = new URLSearchParams({ desde, hasta });
    return api.get<MovCajaParaConciliar[]>(
      `/api/v1/finanzas/reconciliacion/${id}/movimientos-caja?${params}`,
    );
  },
};
