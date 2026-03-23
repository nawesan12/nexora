"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { salidasVendedorApi } from "@/lib/salidas-vendedor";
import type { RegistrarSalidaInput, RegistrarRegresoInput } from "@pronto/shared/schemas";

export function useSalidasVendedor({
  page = 1,
  pageSize = 20,
  fecha,
  empleado_id,
}: { page?: number; pageSize?: number; fecha?: string; empleado_id?: string } = {}) {
  return useQuery({
    queryKey: ["salidas-vendedor", page, pageSize, fecha, empleado_id],
    queryFn: () => salidasVendedorApi.list({ page, pageSize, fecha, empleado_id }),
  });
}

export function useSalidaVendedor(id: string) {
  return useQuery({
    queryKey: ["salidas-vendedor", id],
    queryFn: () => salidasVendedorApi.get(id),
    enabled: !!id,
  });
}

export function useRegistrarSalida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: RegistrarSalidaInput) => salidasVendedorApi.registrarSalida(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salidas-vendedor"] });
      toast.success("Salida registrada");
    },
    onError: () => toast.error("Error al registrar salida"),
  });
}

export function useRegistrarRegreso() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RegistrarRegresoInput }) =>
      salidasVendedorApi.registrarRegreso(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salidas-vendedor"] });
      toast.success("Regreso registrado");
    },
    onError: () => toast.error("Error al registrar regreso"),
  });
}

export function useDeleteSalida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => salidasVendedorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salidas-vendedor"] });
      toast.success("Salida eliminada");
    },
    onError: () => toast.error("Error al eliminar salida"),
  });
}
