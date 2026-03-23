"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { pagosApi, pagosProveedorApi } from "@/lib/payments";
import type { PagoInput, PagoProveedorInput, LimiteCreditoInput } from "@pronto/shared/schemas";

// --- Accounts Receivable ---

export function usePagos({
  page = 1,
  pageSize = 20,
  search,
}: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["pagos", page, pageSize, search],
    queryFn: () => pagosApi.list({ page, pageSize, search }),
  });
}

export function usePago(id: string) {
  return useQuery({
    queryKey: ["pagos", id],
    queryFn: () => pagosApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PagoInput) => pagosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      toast.success("Pago registrado");
    },
    onError: () => toast.error("Error al registrar pago"),
  });
}

export function useAnularPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagosApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos"] });
      toast.success("Pago anulado");
    },
    onError: () => toast.error("Error al anular pago"),
  });
}

export function useAgingReport() {
  return useQuery({
    queryKey: ["aging-report"],
    queryFn: () => pagosApi.getAgingReport(),
  });
}

export function useComprobantesConDeuda({
  page = 1,
  pageSize = 50,
  clienteId,
}: { page?: number; pageSize?: number; clienteId?: string } = {}) {
  return useQuery({
    queryKey: ["comprobantes-con-deuda", page, pageSize, clienteId],
    queryFn: () => pagosApi.listComprobantesConDeuda({ page, pageSize, clienteId }),
    enabled: !!clienteId,
  });
}

export function useClienteBalance(clienteId: string) {
  return useQuery({
    queryKey: ["cliente-balance", clienteId],
    queryFn: () => pagosApi.getClienteBalance(clienteId),
    enabled: !!clienteId,
  });
}

export function useUpdateLimiteCredito() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, data }: { clienteId: string; data: LimiteCreditoInput }) =>
      pagosApi.updateLimiteCredito(clienteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cliente-balance"] });
      toast.success("Limite de credito actualizado");
    },
    onError: () => toast.error("Error al actualizar limite de credito"),
  });
}

// --- Accounts Payable ---

export function usePagosProveedor({
  page = 1,
  pageSize = 20,
  search,
}: { page?: number; pageSize?: number; search?: string } = {}) {
  return useQuery({
    queryKey: ["pagos-proveedor", page, pageSize, search],
    queryFn: () => pagosProveedorApi.list({ page, pageSize, search }),
  });
}

export function usePagoProveedor(id: string) {
  return useQuery({
    queryKey: ["pagos-proveedor", id],
    queryFn: () => pagosProveedorApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePagoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PagoProveedorInput) => pagosProveedorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos-proveedor"] });
      toast.success("Pago a proveedor registrado");
    },
    onError: () => toast.error("Error al registrar pago a proveedor"),
  });
}

export function useAnularPagoProveedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pagosProveedorApi.anular(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pagos-proveedor"] });
      toast.success("Pago a proveedor anulado");
    },
    onError: () => toast.error("Error al anular pago a proveedor"),
  });
}
