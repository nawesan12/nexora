"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { comprasApi } from "@/lib/purchases";
import type { OrdenCompraInput, ReceiveInput } from "@nexora/shared/schemas";

export function useOrdenesCompra({ page, pageSize, search, estado }: { page?: number; pageSize?: number; search?: string; estado?: string } = {}) {
  return useQuery({
    queryKey: ["compras", page, pageSize, search, estado],
    queryFn: () => comprasApi.list({ page, pageSize, search, estado }),
  });
}

export function useOrdenCompra(id: string) {
  return useQuery({
    queryKey: ["compras", id],
    queryFn: () => comprasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: OrdenCompraInput) => comprasApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compras"] }); toast.success("Orden de compra creada"); },
    onError: () => toast.error("Error al crear orden de compra"),
  });
}

export function useUpdateOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrdenCompraInput }) => comprasApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compras"] }); toast.success("Orden actualizada"); },
    onError: () => toast.error("Error al actualizar orden"),
  });
}

export function useDeleteOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => comprasApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compras"] }); toast.success("Orden eliminada"); },
    onError: () => toast.error("Error al eliminar orden"),
  });
}

export function useApproveOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comentario }: { id: string; comentario?: string }) => comprasApi.approve(id, { comentario }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compras"] }); toast.success("Orden aprobada"); },
    onError: () => toast.error("Error al aprobar orden"),
  });
}

export function useReceiveOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceiveInput }) => comprasApi.receive(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compras"] }); toast.success("Mercadería recibida"); },
    onError: () => toast.error("Error al registrar recepción"),
  });
}

export function useCancelOrdenCompra() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, comentario }: { id: string; comentario?: string }) => comprasApi.cancel(id, { comentario }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["compras"] }); toast.success("Orden cancelada"); },
    onError: () => toast.error("Error al cancelar orden"),
  });
}
