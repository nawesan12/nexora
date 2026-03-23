"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { retencionesApi } from "@/lib/retenciones";
import type { RetencionInput } from "@pronto/shared/schemas";

export function useRetenciones({
  page = 1,
  pageSize = 20,
  tipo,
  entidad_tipo,
  periodo,
}: {
  page?: number;
  pageSize?: number;
  tipo?: string;
  entidad_tipo?: string;
  periodo?: string;
} = {}) {
  return useQuery({
    queryKey: ["retenciones", page, pageSize, tipo, entidad_tipo, periodo],
    queryFn: () => retencionesApi.list({ page, pageSize, tipo, entidad_tipo, periodo }),
  });
}

export function useRetencion(id: string) {
  return useQuery({
    queryKey: ["retenciones", id],
    queryFn: () => retencionesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRetencion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RetencionInput) => retencionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retenciones"] });
      toast.success("Retencion registrada");
    },
    onError: () => toast.error("Error al registrar retencion"),
  });
}

export function useAnularRetencion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retencionesApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retenciones"] });
      toast.success("Retencion anulada");
    },
    onError: () => toast.error("Error al anular retencion"),
  });
}

export function useDeleteRetencion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => retencionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["retenciones"] });
      toast.success("Retencion eliminada");
    },
    onError: () => toast.error("Error al eliminar retencion"),
  });
}
