import { api } from "@/lib/api-client";
import type {
  EvaluacionProveedor,
  PromedioEvaluacion,
} from "@pronto/shared/types";
import type { EvaluacionProveedorInput } from "@pronto/shared/schemas";

interface ListEvaluacionesParams {
  proveedorId: string;
  page?: number;
  pageSize?: number;
}

export const evaluacionesApi = {
  list: ({ proveedorId, page = 1, pageSize = 20 }: ListEvaluacionesParams) => {
    const params = new URLSearchParams({
      proveedor_id: proveedorId,
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<EvaluacionProveedor[]>(
      `/api/v1/proveedores/evaluaciones?${params}`,
    );
  },
  create: (data: EvaluacionProveedorInput) =>
    api.post<EvaluacionProveedor>(
      "/api/v1/proveedores/evaluaciones",
      data,
    ),
  getPromedio: (proveedorId: string) =>
    api.get<PromedioEvaluacion>(
      `/api/v1/proveedores/${proveedorId}/evaluaciones/promedio`,
    ),
};
