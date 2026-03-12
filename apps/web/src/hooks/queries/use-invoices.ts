"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { facturasApi } from "@/lib/invoices";
import { afipApi } from "@/lib/afip";
import type { CreateFromPedidoInput, CreateManualComprobanteInput } from "@nexora/shared/schemas";

export function useFacturas({
  page = 1,
  pageSize = 20,
  search,
  estado,
  cliente_id,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
  cliente_id?: string;
} = {}) {
  return useQuery({
    queryKey: ["facturas", page, pageSize, search, estado, cliente_id],
    queryFn: () => facturasApi.list({ page, pageSize, search, estado, cliente_id }),
  });
}

export function useFactura(id: string) {
  return useQuery({
    queryKey: ["facturas", id],
    queryFn: () => facturasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateFacturaFromPedido() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFromPedidoInput) => facturasApi.createFromPedido(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura creada");
    },
    onError: () => toast.error("Error al crear factura"),
  });
}

export function useCreateFacturaManual() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateManualComprobanteInput) => facturasApi.createManual(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura creada");
    },
    onError: () => toast.error("Error al crear factura"),
  });
}

export function useEmitFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturasApi.emit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura emitida");
    },
    onError: () => toast.error("Error al emitir factura"),
  });
}

export function useVoidFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturasApi.void(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura anulada");
    },
    onError: () => toast.error("Error al anular factura"),
  });
}

export function useDeleteFactura() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => facturasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura eliminada");
    },
    onError: () => toast.error("Error al eliminar factura"),
  });
}

export function useAuthorizeAfip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => afipApi.authorizeInvoice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["facturas"] });
      toast.success("Factura autorizada en AFIP");
    },
    onError: () => toast.error("Error al autorizar en AFIP"),
  });
}
