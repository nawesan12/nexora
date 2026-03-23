import { api } from "@/lib/api-client";

export interface ApiClient {
  id: string;
  nombre: string;
  api_key: string;
  cors_origins: string[];
  activo: boolean;
  last_used_at?: string;
  created_at: string;
}

export interface ApiClientCreateResult extends ApiClient {
  api_secret: string; // Only returned on create/rotate
}

export const apiClientsApi = {
  list: ({ page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {}) => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return api.getWithMeta<ApiClient[]>(`/api/v1/integraciones/api-clients?${params}`);
  },
  get: (id: string) => api.get<ApiClient>(`/api/v1/integraciones/api-clients/${id}`),
  create: (data: { nombre: string; cors_origins: string[] }) =>
    api.post<ApiClientCreateResult>("/api/v1/integraciones/api-clients", data),
  update: (id: string, data: { nombre: string; cors_origins: string[]; activo: boolean }) =>
    api.put<ApiClient>(`/api/v1/integraciones/api-clients/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/integraciones/api-clients/${id}`),
  rotateSecret: (id: string) =>
    api.post<ApiClientCreateResult>(`/api/v1/integraciones/api-clients/${id}/rotate-secret`),
};
