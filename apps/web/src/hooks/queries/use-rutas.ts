"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rutasApi } from "@/lib/rutas";

export function useRutas({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: ["rutas", page, pageSize],
    queryFn: () => rutasApi.list({ page, pageSize }),
  });
}

export function useRuta(id: string) {
  return useQuery({
    queryKey: ["rutas", id],
    queryFn: () => rutasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateRuta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => rutasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas"] });
      toast.success("Ruta creada");
    },
    onError: () => toast.error("Error al crear ruta"),
  });
}

export function useUpdateRuta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      rutasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas"] });
      toast.success("Ruta actualizada");
    },
    onError: () => toast.error("Error al actualizar ruta"),
  });
}

export function useDeleteRuta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => rutasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas"] });
      toast.success("Ruta eliminada");
    },
    onError: () => toast.error("Error al eliminar ruta"),
  });
}

export function useGenerarReparto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { fecha: string; empleado_id: string };
    }) => rutasApi.generarReparto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rutas"] });
      queryClient.invalidateQueries({ queryKey: ["repartos"] });
      toast.success("Reparto generado desde ruta");
    },
    onError: () => toast.error("Error al generar reparto"),
  });
}
