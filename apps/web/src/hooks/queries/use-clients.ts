"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { clientesApi, direccionesApi } from "@/lib/clients";
import type { ClienteInput, DireccionInput } from "@nexora/shared/schemas";

// --- Clientes ---

export function useClientes({
  page = 1,
  pageSize = 20,
  search,
  reputacion,
  condicionIva,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  reputacion?: string;
  condicionIva?: string;
} = {}) {
  return useQuery({
    queryKey: ["clientes", page, pageSize, search, reputacion, condicionIva],
    queryFn: () =>
      clientesApi.list({
        page,
        pageSize,
        search,
        reputacion,
        condicion_iva: condicionIva,
      }),
  });
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: ["clientes", id],
    queryFn: () => clientesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ClienteInput) => clientesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente creado");
    },
    onError: () => toast.error("Error al crear cliente"),
  });
}

export function useUpdateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClienteInput }) =>
      clientesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente actualizado");
    },
    onError: () => toast.error("Error al actualizar cliente"),
  });
}

export function useDeleteCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente eliminado");
    },
    onError: () => toast.error("Error al eliminar cliente"),
  });
}

// --- Direcciones ---

export function useDirecciones(clienteId: string) {
  return useQuery({
    queryKey: ["direcciones", clienteId],
    queryFn: () => direccionesApi.list(clienteId),
    enabled: !!clienteId,
  });
}

export function useCreateDireccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clienteId,
      data,
    }: {
      clienteId: string;
      data: DireccionInput;
    }) => direccionesApi.create(clienteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
      toast.success("Dirección creada");
    },
    onError: () => toast.error("Error al crear dirección"),
  });
}

export function useUpdateDireccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clienteId,
      direccionId,
      data,
    }: {
      clienteId: string;
      direccionId: string;
      data: DireccionInput;
    }) => direccionesApi.update(clienteId, direccionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
      toast.success("Dirección actualizada");
    },
    onError: () => toast.error("Error al actualizar dirección"),
  });
}

export function useDeleteDireccion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clienteId,
      direccionId,
    }: {
      clienteId: string;
      direccionId: string;
    }) => direccionesApi.delete(clienteId, direccionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
      toast.success("Dirección eliminada");
    },
    onError: () => toast.error("Error al eliminar dirección"),
  });
}

export function useSetDireccionPrincipal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      clienteId,
      direccionId,
    }: {
      clienteId: string;
      direccionId: string;
    }) => direccionesApi.setPrincipal(clienteId, direccionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["direcciones"] });
      toast.success("Dirección marcada como principal");
    },
    onError: () => toast.error("Error al marcar dirección como principal"),
  });
}
