"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { facturasProveedorApi } from "@/lib/facturas-proveedor";
import type { FacturaProveedorInput } from "@pronto/shared/schemas";

export function useFacturasProveedor({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["facturas-proveedor", page, pageSize],
    queryFn: () => facturasProveedorApi.list({ page, pageSize }),
  });
}

export function useFacturaProveedor(id: string) {
  return useQuery({
    queryKey: ["facturas-proveedor", id],
    queryFn: () => facturasProveedorApi.get(id),
    enabled: !!id,
  });
}

export function useCreateFacturaProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FacturaProveedorInput) =>
      facturasProveedorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas-proveedor"] });
      toast.success("Factura de proveedor creada");
    },
    onError: () => toast.error("Error al crear factura de proveedor"),
  });
}

export function useAnularFacturaProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturasProveedorApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas-proveedor"] });
      toast.success("Factura de proveedor anulada");
    },
    onError: () => toast.error("Error al anular factura de proveedor"),
  });
}

export function useDeleteFacturaProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturasProveedorApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas-proveedor"] });
      toast.success("Factura de proveedor eliminada");
    },
    onError: () => toast.error("Error al eliminar factura de proveedor"),
  });
}
