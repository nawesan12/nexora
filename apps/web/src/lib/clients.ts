import { api } from "@/lib/api-client";
import type { Cliente, Direccion } from "@pronto/shared/types";
import type { ClienteInput, DireccionInput } from "@pronto/shared/schemas";

interface ListClientesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  reputacion?: string;
  condicion_iva?: string;
}

export const clientesApi = {
  list: ({
    page = 1,
    pageSize = 20,
    search,
    reputacion,
    condicion_iva,
  }: ListClientesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (reputacion) params.set("reputacion", reputacion);
    if (condicion_iva) params.set("condicion_iva", condicion_iva);
    return api.getWithMeta<Cliente[]>(`/api/v1/clientes?${params}`);
  },
  get: (id: string) => api.get<Cliente>(`/api/v1/clientes/${id}`),
  create: (data: ClienteInput) =>
    api.post<Cliente>("/api/v1/clientes", data),
  update: (id: string, data: ClienteInput) =>
    api.put<Cliente>(`/api/v1/clientes/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/clientes/${id}`),
};

export const direccionesApi = {
  list: (clienteId: string) =>
    api.get<Direccion[]>(`/api/v1/clientes/${clienteId}/direcciones`),
  create: (clienteId: string, data: DireccionInput) =>
    api.post<Direccion>(
      `/api/v1/clientes/${clienteId}/direcciones`,
      data,
    ),
  update: (clienteId: string, direccionId: string, data: DireccionInput) =>
    api.put<Direccion>(
      `/api/v1/clientes/${clienteId}/direcciones/${direccionId}`,
      data,
    ),
  delete: (clienteId: string, direccionId: string) =>
    api.del(`/api/v1/clientes/${clienteId}/direcciones/${direccionId}`),
  setPrincipal: (clienteId: string, direccionId: string) =>
    api.put(
      `/api/v1/clientes/${clienteId}/direcciones/${direccionId}/principal`,
    ),
};
