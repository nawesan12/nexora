"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { branchesApi } from "@/lib/branches";
import type { SucursalInput } from "@nexora/shared/schemas";

export function useBranches() {
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => branchesApi.list(),
  });
}

export function useBranch(id: string) {
  return useQuery({
    queryKey: ["branches", id],
    queryFn: () => branchesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SucursalInput) => branchesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sucursal creada");
    },
    onError: () => toast.error("Error al crear sucursal"),
  });
}

export function useUpdateBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SucursalInput }) =>
      branchesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sucursal actualizada");
    },
    onError: () => toast.error("Error al actualizar sucursal"),
  });
}

export function useDeleteBranch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => branchesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branches"] });
      toast.success("Sucursal eliminada");
    },
    onError: () => toast.error("Error al eliminar sucursal"),
  });
}
