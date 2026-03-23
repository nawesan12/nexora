"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { mantenimientosApi } from "@/lib/mantenimientos";
import type { MantenimientoVehiculoInput } from "@pronto/shared/schemas";

export function useMantenimientos({
  page = 1,
  pageSize = 20,
  vehiculo_id,
}: { page?: number; pageSize?: number; vehiculo_id?: string } = {}) {
  return useQuery({
    queryKey: ["mantenimientos", page, pageSize, vehiculo_id],
    queryFn: () => mantenimientosApi.list({ page, pageSize, vehiculo_id }),
  });
}

export function useMantenimiento(id: string) {
  return useQuery({
    queryKey: ["mantenimientos", id],
    queryFn: () => mantenimientosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MantenimientoVehiculoInput) => mantenimientosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mantenimientos"] });
      toast.success("Mantenimiento registrado");
    },
    onError: () => toast.error("Error al registrar mantenimiento"),
  });
}

export function useUpdateMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MantenimientoVehiculoInput }) =>
      mantenimientosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mantenimientos"] });
      toast.success("Mantenimiento actualizado");
    },
    onError: () => toast.error("Error al actualizar mantenimiento"),
  });
}

export function useDeleteMantenimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => mantenimientosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mantenimientos"] });
      toast.success("Mantenimiento eliminado");
    },
    onError: () => toast.error("Error al eliminar mantenimiento"),
  });
}
