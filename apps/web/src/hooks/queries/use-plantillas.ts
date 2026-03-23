"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { plantillasApi } from "@/lib/plantillas";
import type { PlantillaPedidoInput } from "@pronto/shared/schemas";

export function usePlantillas({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["plantillas", page, pageSize],
    queryFn: () => plantillasApi.list({ page, pageSize }),
  });
}

export function usePlantilla(id: string) {
  return useQuery({
    queryKey: ["plantillas", id],
    queryFn: () => plantillasApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PlantillaPedidoInput) => plantillasApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plantillas"] });
      toast.success("Plantilla creada");
    },
    onError: () => toast.error("Error al crear plantilla"),
  });
}

export function useUpdatePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: PlantillaPedidoInput;
    }) => plantillasApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plantillas"] });
      toast.success("Plantilla actualizada");
    },
    onError: () => toast.error("Error al actualizar plantilla"),
  });
}

export function useDeletePlantilla() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plantillasApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plantillas"] });
      toast.success("Plantilla eliminada");
    },
    onError: () => toast.error("Error al eliminar plantilla"),
  });
}

export function useGenerarPedido() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => plantillasApi.generar(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["plantillas"] });
      toast.success("Pedido generado desde plantilla");
    },
    onError: () => toast.error("Error al generar pedido"),
  });
}
