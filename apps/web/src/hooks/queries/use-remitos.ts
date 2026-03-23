"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { remitosApi } from "@/lib/remitos";
import type { RemitoFromPedidoInput } from "@pronto/shared/schemas";

export function useRemitos({
  page = 1,
  pageSize = 20,
  estado,
}: { page?: number; pageSize?: number; estado?: string } = {}) {
  return useQuery({
    queryKey: ["remitos", page, pageSize, estado],
    queryFn: () => remitosApi.list({ page, pageSize, estado }),
  });
}

export function useRemito(id: string) {
  return useQuery({
    queryKey: ["remitos", id],
    queryFn: () => remitosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRemito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RemitoFromPedidoInput) => remitosApi.createFromPedido(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remitos"] });
      toast.success("Remito creado");
    },
    onError: () => toast.error("Error al crear remito"),
  });
}

export function useEmitirRemito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remitosApi.emitir(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remitos"] });
      toast.success("Remito emitido");
    },
    onError: () => toast.error("Error al emitir remito"),
  });
}

export function useEntregarRemito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, firma_url }: { id: string; firma_url?: string }) =>
      remitosApi.entregar(id, firma_url ? { firma_url } : undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remitos"] });
      toast.success("Remito entregado");
    },
    onError: () => toast.error("Error al entregar remito"),
  });
}

export function useAnularRemito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remitosApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remitos"] });
      toast.success("Remito anulado");
    },
    onError: () => toast.error("Error al anular remito"),
  });
}

export function useDeleteRemito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => remitosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remitos"] });
      toast.success("Remito eliminado");
    },
    onError: () => toast.error("Error al eliminar remito"),
  });
}
