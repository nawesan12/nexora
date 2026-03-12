"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { proveedoresApi } from "@/lib/suppliers";
import type { ProveedorInput } from "@nexora/shared/schemas";

export function useProveedores({ page, pageSize, search }: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["proveedores", page, pageSize, search],
    queryFn: () => proveedoresApi.list({ page, pageSize, search }),
  });
}

export function useProveedor(id: string) {
  return useQuery({
    queryKey: ["proveedores", id],
    queryFn: () => proveedoresApi.get(id),
    enabled: !!id,
  });
}

export function useCreateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProveedorInput) => proveedoresApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proveedores"] }); toast.success("Proveedor creado"); },
    onError: () => toast.error("Error al crear proveedor"),
  });
}

export function useUpdateProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProveedorInput }) => proveedoresApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proveedores"] }); toast.success("Proveedor actualizado"); },
    onError: () => toast.error("Error al actualizar proveedor"),
  });
}

export function useDeleteProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => proveedoresApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["proveedores"] }); toast.success("Proveedor eliminado"); },
    onError: () => toast.error("Error al eliminar proveedor"),
  });
}
