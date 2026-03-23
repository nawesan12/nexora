"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { devolucionesProveedorApi } from "@/lib/devoluciones-proveedor";
import type { DevolucionProveedorInput } from "@pronto/shared/schemas";

export function useDevolucionesProveedor({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["devoluciones-proveedor", page, pageSize],
    queryFn: () => devolucionesProveedorApi.list({ page, pageSize }),
  });
}

export function useDevolucionProveedor(id: string) {
  return useQuery({
    queryKey: ["devoluciones-proveedor", id],
    queryFn: () => devolucionesProveedorApi.get(id),
    enabled: !!id,
  });
}

export function useCreateDevolucionProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DevolucionProveedorInput) =>
      devolucionesProveedorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones-proveedor"] });
      toast.success("Devolucion a proveedor creada");
    },
    onError: () => toast.error("Error al crear devolucion a proveedor"),
  });
}

export function useTransitionDevolucionProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado }: { id: string; estado: string }) =>
      devolucionesProveedorApi.transition(id, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones-proveedor"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al cambiar estado"),
  });
}

export function useDeleteDevolucionProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => devolucionesProveedorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devoluciones-proveedor"] });
      toast.success("Devolucion a proveedor eliminada");
    },
    onError: () => toast.error("Error al eliminar devolucion a proveedor"),
  });
}
