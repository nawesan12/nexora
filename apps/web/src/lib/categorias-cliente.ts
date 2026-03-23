import { api } from "@/lib/api-client";
import type { CategoriaCliente } from "@pronto/shared/types";

interface ListParams {
  page?: number;
  pageSize?: number;
}

export const categoriasClienteApi = {
  list: ({ page = 1, pageSize = 20 }: ListParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<CategoriaCliente[]>(
      `/api/v1/clientes/categorias?${params}`,
    );
  },
  get: (id: string) =>
    api.get<CategoriaCliente>(`/api/v1/clientes/categorias/${id}`),
  create: (data: unknown) =>
    api.post<CategoriaCliente>("/api/v1/clientes/categorias", data),
  update: (id: string, data: unknown) =>
    api.put<CategoriaCliente>(`/api/v1/clientes/categorias/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/clientes/categorias/${id}`),
};
