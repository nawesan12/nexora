"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pedidosApi, configImpuestosApi } from "@/lib/orders";
import type { PedidoInput, TransicionEstadoInput, ConfiguracionImpuestoInput } from "@nexora/shared/schemas";

// --- Pedidos ---

export function usePedidos({
  page = 1,
  pageSize = 20,
  search,
  estado,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
} = {}) {
  return useQuery({
    queryKey: ["pedidos", page, pageSize, search, estado],
    queryFn: () => pedidosApi.list({ page, pageSize, search, estado }),
  });
}

export function usePedido(id: string) {
  return useQuery({
    queryKey: ["pedidos", id],
    queryFn: () => pedidosApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PedidoInput) => pedidosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido creado");
    },
    onError: () => toast.error("Error al crear pedido"),
  });
}

export function useUpdatePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PedidoInput }) =>
      pedidosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido actualizado");
    },
    onError: () => toast.error("Error al actualizar pedido"),
  });
}

export function useDeletePedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pedidosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido eliminado");
    },
    onError: () => toast.error("Error al eliminar pedido"),
  });
}

export function useTransitionPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransicionEstadoInput }) =>
      pedidosApi.transition(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });
}

// --- Configuracion Impuestos ---

export function useConfigImpuestos() {
  return useQuery({
    queryKey: ["config-impuestos"],
    queryFn: () => configImpuestosApi.list(),
  });
}

export function useCreateConfigImpuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfiguracionImpuestoInput) =>
      configImpuestosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-impuestos"] });
      toast.success("Impuesto creado");
    },
    onError: () => toast.error("Error al crear impuesto"),
  });
}

export function useUpdateConfigImpuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConfiguracionImpuestoInput }) =>
      configImpuestosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-impuestos"] });
      toast.success("Impuesto actualizado");
    },
    onError: () => toast.error("Error al actualizar impuesto"),
  });
}

export function useDeleteConfigImpuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => configImpuestosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-impuestos"] });
      toast.success("Impuesto eliminado");
    },
    onError: () => toast.error("Error al eliminar impuesto"),
  });
}
