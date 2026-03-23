"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { categoriasClienteApi } from "@/lib/categorias-cliente";

export function useCategoriasCliente({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: ["categorias-cliente", page, pageSize],
    queryFn: () => categoriasClienteApi.list({ page, pageSize }),
  });
}

export function useCategoriaCliente(id: string) {
  return useQuery({
    queryKey: ["categorias-cliente", id],
    queryFn: () => categoriasClienteApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCategoriaCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => categoriasClienteApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-cliente"] });
      toast.success("Categoria creada");
    },
    onError: () => toast.error("Error al crear categoria"),
  });
}

export function useUpdateCategoriaCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      categoriasClienteApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-cliente"] });
      toast.success("Categoria actualizada");
    },
    onError: () => toast.error("Error al actualizar categoria"),
  });
}

export function useDeleteCategoriaCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriasClienteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categorias-cliente"] });
      toast.success("Categoria eliminada");
    },
    onError: () => toast.error("Error al eliminar categoria"),
  });
}
