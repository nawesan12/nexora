import { api } from "@/lib/api-client";
import type { AfipConfig, AfipAuthResult } from "@nexora/shared/types";
import type { AfipConfigInput } from "@nexora/shared/schemas";

export const afipApi = {
  getConfig: (sucursalId: string) =>
    api.get<AfipConfig>(`/api/v1/configuracion/afip/${sucursalId}`),
  saveConfig: (sucursalId: string, data: AfipConfigInput) =>
    api.put<AfipConfig>(`/api/v1/configuracion/afip/${sucursalId}`, data),
  testConnection: (sucursalId: string) =>
    api.post<AfipAuthResult>(`/api/v1/configuracion/afip/${sucursalId}/test`),
  authorizeInvoice: (invoiceId: string) =>
    api.post<AfipAuthResult>(`/api/v1/facturas/${invoiceId}/afip`),
};
