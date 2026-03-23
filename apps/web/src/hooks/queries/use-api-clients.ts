"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClientsApi } from "@/lib/api-clients";

export function useApiClients({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["api-clients", page, pageSize],
    queryFn: () => apiClientsApi.list({ page, pageSize }),
  });
}

export function useApiClient(id: string) {
  return useQuery({
    queryKey: ["api-clients", id],
    queryFn: () => apiClientsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateApiClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { nombre: string; cors_origins: string[] }) =>
      apiClientsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-clients"] });
    },
    onError: () => toast.error("Error al crear API client"),
  });
}

export function useUpdateApiClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { nombre: string; cors_origins: string[]; activo: boolean };
    }) => apiClientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-clients"] });
      toast.success("API client actualizado");
    },
    onError: () => toast.error("Error al actualizar API client"),
  });
}

export function useDeleteApiClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-clients"] });
      toast.success("API client eliminado");
    },
    onError: () => toast.error("Error al eliminar API client"),
  });
}

export function useRotateApiClientSecret() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClientsApi.rotateSecret(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-clients"] });
    },
    onError: () => toast.error("Error al rotar secreto"),
  });
}
