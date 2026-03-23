import { api } from "@/lib/api-client";
import type {
  FamiliaProducto,
  CategoriaProducto,
  Producto,
  CatalogoProducto,
  Meta,
} from "@pronto/shared/types";
import type {
  FamiliaProductoInput,
  CategoriaProductoInput,
  ProductoInput,
  CatalogoProductoInput,
} from "@pronto/shared/schemas";

export const familiasApi = {
  list: (page = 1, pageSize = 20) =>
    api.getWithMeta<FamiliaProducto[]>(
      `/api/v1/productos/familias?page=${page}&pageSize=${pageSize}`,
    ),
  get: (id: string) =>
    api.get<FamiliaProducto>(`/api/v1/productos/familias/${id}`),
  create: (data: FamiliaProductoInput) =>
    api.post<FamiliaProducto>("/api/v1/productos/familias", data),
  update: (id: string, data: FamiliaProductoInput) =>
    api.put<FamiliaProducto>(`/api/v1/productos/familias/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/productos/familias/${id}`),
};

export const categoriasApi = {
  list: (page = 1, pageSize = 20) =>
    api.getWithMeta<CategoriaProducto[]>(
      `/api/v1/productos/categorias?page=${page}&pageSize=${pageSize}`,
    ),
  listByFamilia: (familiaId: string) =>
    api.get<CategoriaProducto[]>(
      `/api/v1/productos/categorias?familia_id=${familiaId}`,
    ),
  get: (id: string) =>
    api.get<CategoriaProducto>(`/api/v1/productos/categorias/${id}`),
  create: (data: CategoriaProductoInput) =>
    api.post<CategoriaProducto>("/api/v1/productos/categorias", data),
  update: (id: string, data: CategoriaProductoInput) =>
    api.put<CategoriaProducto>(`/api/v1/productos/categorias/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/productos/categorias/${id}`),
};

interface ListProductosParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export const productosApi = {
  list: ({ page = 1, pageSize = 20, search }: ListProductosParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    return api.getWithMeta<Producto[]>(`/api/v1/productos?${params}`);
  },
  get: (id: string) => api.get<Producto>(`/api/v1/productos/${id}`),
  create: (data: ProductoInput) =>
    api.post<Producto>("/api/v1/productos", data),
  update: (id: string, data: ProductoInput) =>
    api.put<Producto>(`/api/v1/productos/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/productos/${id}`),
};

export const catalogoApi = {
  listBySucursal: (
    sucursalId: string,
    page = 1,
    pageSize = 20,
  ) =>
    api.getWithMeta<CatalogoProducto[]>(
      `/api/v1/catalogo/sucursal/${sucursalId}?page=${page}&pageSize=${pageSize}`,
    ),
  upsert: (data: CatalogoProductoInput) =>
    api.post<CatalogoProducto>("/api/v1/catalogo", data),
  delete: (productoId: string, sucursalId: string) =>
    api.del(`/api/v1/catalogo/${productoId}/sucursal/${sucursalId}`),
};
