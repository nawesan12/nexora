"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  familiasApi,
  categoriasApi,
  productosApi,
  catalogoApi,
} from "@/lib/products";
import type {
  FamiliaProductoInput,
  CategoriaProductoInput,
  ProductoInput,
  CatalogoProductoInput,
} from "@pronto/shared/schemas";

// --- Familias ---

export function useFamilias(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["familias", page, pageSize],
    queryFn: () => familiasApi.list(page, pageSize),
  });
}

export function useCreateFamilia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FamiliaProductoInput) => familiasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familias"] });
      toast.success("Familia creada");
    },
    onError: () => toast.error("Error al crear familia"),
  });
}

export function useUpdateFamilia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FamiliaProductoInput }) =>
      familiasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familias"] });
      toast.success("Familia actualizada");
    },
    onError: () => toast.error("Error al actualizar familia"),
  });
}

export function useDeleteFamilia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => familiasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["familias"] });
      toast.success("Familia eliminada");
    },
    onError: () => toast.error("Error al eliminar familia"),
  });
}

// --- Categorias ---

export function useCategorias(page = 1, pageSize = 20) {
  return useQuery({
    queryKey: ["categorias", page, pageSize],
    queryFn: () => categoriasApi.list(page, pageSize),
  });
}

export function useCategoriasByFamilia(familiaId: string) {
  return useQuery({
    queryKey: ["categorias", "familia", familiaId],
    queryFn: () => categoriasApi.listByFamilia(familiaId),
    enabled: !!familiaId,
  });
}

export function useCreateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CategoriaProductoInput) => categoriasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría creada");
    },
    onError: () => toast.error("Error al crear categoría"),
  });
}

export function useUpdateCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CategoriaProductoInput;
    }) => categoriasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría actualizada");
    },
    onError: () => toast.error("Error al actualizar categoría"),
  });
}

export function useDeleteCategoria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias"] });
      toast.success("Categoría eliminada");
    },
    onError: () => toast.error("Error al eliminar categoría"),
  });
}

// --- Productos ---

export function useProductos({
  page = 1,
  pageSize = 20,
  search,
}: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["productos", page, pageSize, search],
    queryFn: () => productosApi.list({ page, pageSize, search }),
  });
}

export function useProducto(id: string) {
  return useQuery({
    queryKey: ["productos", id],
    queryFn: () => productosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductoInput) => productosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto creado");
    },
    onError: () => toast.error("Error al crear producto"),
  });
}

export function useUpdateProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductoInput }) =>
      productosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto actualizado");
    },
    onError: () => toast.error("Error al actualizar producto"),
  });
}

export function useDeleteProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => productosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productos"] });
      toast.success("Producto eliminado");
    },
    onError: () => toast.error("Error al eliminar producto"),
  });
}

// --- Catalogo ---

export function useCatalogo(
  sucursalId: string,
  page = 1,
  pageSize = 20,
) {
  return useQuery({
    queryKey: ["catalogo", sucursalId, page, pageSize],
    queryFn: () => catalogoApi.listBySucursal(sucursalId, page, pageSize),
    enabled: !!sucursalId,
  });
}

export function useUpsertCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CatalogoProductoInput) => catalogoApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      toast.success("Catálogo actualizado");
    },
    onError: () => toast.error("Error al actualizar catálogo"),
  });
}

export function useDeleteCatalogo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productoId,
      sucursalId,
    }: {
      productoId: string;
      sucursalId: string;
    }) => catalogoApi.delete(productoId, sucursalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogo"] });
      toast.success("Producto eliminado del catálogo");
    },
    onError: () => toast.error("Error al eliminar del catálogo"),
  });
}
