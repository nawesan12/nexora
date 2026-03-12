"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { transferenciasApi } from "@/lib/transfers";

export function useTransferencias({
  page = 1,
  pageSize = 20,
  estado,
}: {
  page?: number;
  pageSize?: number;
  estado?: string;
} = {}) {
  return useQuery({
    queryKey: ["transferencias", page, pageSize, estado],
    queryFn: () => transferenciasApi.list({ page, pageSize, estado }),
  });
}

export function useTransferencia(id: string) {
  return useQuery({
    queryKey: ["transferencias", id],
    queryFn: () => transferenciasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => transferenciasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transferencias"] });
      toast.success("Transferencia creada");
    },
    onError: () => toast.error("Error al crear transferencia"),
  });
}

export function useTransitionTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: {
        estado: string;
        observaciones?: string;
        items?: Array<{
          id: string;
          cantidad_enviada?: number;
          cantidad_recibida?: number;
        }>;
      };
    }) => transferenciasApi.transition(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["transferencias"] });
      queryClient.invalidateQueries({
        queryKey: ["transferencias", variables.id],
      });
      toast.success("Estado de transferencia actualizado");
    },
    onError: () => toast.error("Error al cambiar estado de transferencia"),
  });
}

export function useDeleteTransferencia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transferenciasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transferencias"] });
      toast.success("Transferencia eliminada");
    },
    onError: () => toast.error("Error al eliminar transferencia"),
  });
}
