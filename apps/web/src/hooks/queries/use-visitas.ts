"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { visitasApi } from "@/lib/visitas";
import type { VisitaClienteInput } from "@pronto/shared/schemas";

export function useVisitas({
  page = 1,
  pageSize = 20,
  vendedor_id,
  fecha_desde,
  fecha_hasta,
  resultado,
}: {
  page?: number;
  pageSize?: number;
  vendedor_id?: string;
  fecha_desde?: string;
  fecha_hasta?: string;
  resultado?: string;
} = {}) {
  return useQuery({
    queryKey: ["visitas", page, pageSize, vendedor_id, fecha_desde, fecha_hasta, resultado],
    queryFn: () =>
      visitasApi.list({ page, pageSize, vendedor_id, fecha_desde, fecha_hasta, resultado }),
  });
}

export function useVisitasHoy(vendedorId: string) {
  return useQuery({
    queryKey: ["visitas", "hoy", vendedorId],
    queryFn: () => visitasApi.listToday(vendedorId),
    enabled: !!vendedorId,
  });
}

export function useVisita(id: string) {
  return useQuery({
    queryKey: ["visitas", id],
    queryFn: () => visitasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateVisita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VisitaClienteInput) => visitasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas"] });
      toast.success("Visita registrada");
    },
    onError: () => toast.error("Error al registrar visita"),
  });
}

export function useUpdateVisita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      visitasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas"] });
      toast.success("Visita actualizada");
    },
    onError: () => toast.error("Error al actualizar visita"),
  });
}

export function useDeleteVisita() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => visitasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas"] });
      toast.success("Visita eliminada");
    },
    onError: () => toast.error("Error al eliminar visita"),
  });
}
