"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { devolucionesApi } from "@/lib/devoluciones";
import type { DevolucionInput } from "@pronto/shared/schemas";

export function useDevoluciones({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["devoluciones", page, pageSize],
    queryFn: () => devolucionesApi.list({ page, pageSize }),
  });
}

export function useDevolucion(id: string) {
  return useQuery({
    queryKey: ["devoluciones", id],
    queryFn: () => devolucionesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DevolucionInput) => devolucionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones"] });
      toast.success("Devolucion creada exitosamente");
    },
    onError: () => toast.error("Error al crear devolucion"),
  });
}

export function useApproveDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devolucionesApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones"] });
      toast.success("Devolucion aprobada");
    },
    onError: () => toast.error("Error al aprobar devolucion"),
  });
}

export function useRejectDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devolucionesApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones"] });
      toast.success("Devolucion rechazada");
    },
    onError: () => toast.error("Error al rechazar devolucion"),
  });
}

export function useDeleteDevolucion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devolucionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones"] });
      toast.success("Devolucion eliminada");
    },
    onError: () => toast.error("Error al eliminar devolucion"),
  });
}
