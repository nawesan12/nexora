import { api } from "@/lib/api-client";
import type { ProgramaFidelidad, PuntosCliente, ClientePuntosResumen } from "@pronto/shared/types";
import type { ProgramaFidelidadInput, AcumularPuntosInput, CanjearPuntosInput } from "@pronto/shared/schemas";

export const loyaltyApi = {
  getPrograma: () => api.get<ProgramaFidelidad>("/api/v1/fidelidad/programa"),

  upsertPrograma: (data: ProgramaFidelidadInput) =>
    api.put<ProgramaFidelidad>("/api/v1/fidelidad/programa", data),

  getClientePuntos: (clienteId: string) =>
    api.get<ClientePuntosResumen>(`/api/v1/fidelidad/clientes/${clienteId}/puntos`),

  listMovimientos: ({ clienteId, page = 1, pageSize = 20 }: { clienteId: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return api.getWithMeta<PuntosCliente[]>(`/api/v1/fidelidad/clientes/${clienteId}/movimientos?${params}`);
  },

  acumular: (clienteId: string, data: AcumularPuntosInput) =>
    api.post<PuntosCliente>(`/api/v1/fidelidad/clientes/${clienteId}/acumular`, data),

  canjear: (clienteId: string, data: CanjearPuntosInput) =>
    api.post<PuntosCliente>(`/api/v1/fidelidad/clientes/${clienteId}/canjear`, data),
};
