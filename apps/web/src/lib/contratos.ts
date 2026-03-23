import { api } from "@/lib/api-client";
import type { Contrato } from "@pronto/shared/types";
import type { ContratoInput } from "@pronto/shared/schemas";

interface ListContratosParams {
  page?: number;
  pageSize?: number;
}

export const contratosApi = {
  list: (
    empleadoId: string,
    { page = 1, pageSize = 20 }: ListContratosParams = {},
  ) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Contrato[]>(
      `/api/v1/empleados/${empleadoId}/contratos?${params}`,
    );
  },
  get: (empleadoId: string, contratoId: string) =>
    api.get<Contrato>(
      `/api/v1/empleados/${empleadoId}/contratos/${contratoId}`,
    ),
  create: (empleadoId: string, data: ContratoInput) =>
    api.post<Contrato>(`/api/v1/empleados/${empleadoId}/contratos`, data),
  update: (empleadoId: string, contratoId: string, data: ContratoInput) =>
    api.put<Contrato>(
      `/api/v1/empleados/${empleadoId}/contratos/${contratoId}`,
      data,
    ),
  delete: (empleadoId: string, contratoId: string) =>
    api.del(`/api/v1/empleados/${empleadoId}/contratos/${contratoId}`),
};
