import { api } from "@/lib/api-client";
import type {
  Vehiculo,
  Zona,
  RepartoList,
  RepartoDetail,
  EventoReparto,
} from "@nexora/shared/types";

// Vehiculos
interface ListVehiculosParams {
  page?: number;
  pageSize?: number;
}

export const vehiculosApi = {
  list: ({ page = 1, pageSize = 50 }: ListVehiculosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Vehiculo[]>(`/api/v1/logistica/vehiculos?${params}`);
  },
  get: (id: string) => api.get<Vehiculo>(`/api/v1/logistica/vehiculos/${id}`),
  create: (data: unknown) =>
    api.post<Vehiculo>("/api/v1/logistica/vehiculos", data),
  update: (id: string, data: unknown) =>
    api.put<Vehiculo>(`/api/v1/logistica/vehiculos/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/logistica/vehiculos/${id}`),
};

// Zonas
export const zonasApi = {
  list: ({ page = 1, pageSize = 50 }: ListVehiculosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Zona[]>(`/api/v1/logistica/zonas?${params}`);
  },
  get: (id: string) => api.get<Zona>(`/api/v1/logistica/zonas/${id}`),
  create: (data: unknown) =>
    api.post<Zona>("/api/v1/logistica/zonas", data),
  update: (id: string, data: unknown) =>
    api.put<Zona>(`/api/v1/logistica/zonas/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/logistica/zonas/${id}`),
};

// Repartos
interface ListRepartosParams {
  page?: number;
  pageSize?: number;
  estado?: string;
}

export const repartosApi = {
  list: ({ page = 1, pageSize = 20, estado }: ListRepartosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (estado) params.set("estado", estado);
    return api.getWithMeta<RepartoList[]>(
      `/api/v1/logistica/repartos?${params}`,
    );
  },
  get: (id: string) =>
    api.get<RepartoDetail>(`/api/v1/logistica/repartos/${id}`),
  create: (data: unknown) =>
    api.post<RepartoDetail>("/api/v1/logistica/repartos", data),
  transition: (
    id: string,
    data: { estado: string; km_inicio?: number; km_fin?: number },
  ) =>
    api.patch<RepartoDetail>(
      `/api/v1/logistica/repartos/${id}/estado`,
      data,
    ),
  delete: (id: string) => api.del(`/api/v1/logistica/repartos/${id}`),
};

// Eventos
export const eventosApi = {
  list: (repartoId: string) =>
    api.get<EventoReparto[]>(
      `/api/v1/logistica/repartos/${repartoId}/eventos`,
    ),
  create: (repartoId: string, data: unknown) =>
    api.post<EventoReparto>(
      `/api/v1/logistica/repartos/${repartoId}/eventos`,
      data,
    ),
};
