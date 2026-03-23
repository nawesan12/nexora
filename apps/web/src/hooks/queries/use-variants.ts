"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { variantsApi } from "@/lib/variants";
import type { VarianteInput, OpcionVarianteInput, SKUVarianteInput } from "@pronto/shared/schemas";

export function useVariantes(productoId: string) {
  return useQuery({
    queryKey: ["variantes", productoId],
    queryFn: () => variantsApi.listVariantes(productoId),
    enabled: !!productoId,
  });
}

export function useCreateVariante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VarianteInput) => variantsApi.createVariante(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["variantes", variables.producto_id] });
      toast.success("Variante creada");
    },
    onError: () => toast.error("Error al crear variante"),
  });
}

export function useDeleteVariante() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productoId, id }: { productoId: string; id: string }) =>
      variantsApi.deleteVariante(productoId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["variantes", variables.productoId] });
      toast.success("Variante eliminada");
    },
    onError: () => toast.error("Error al eliminar variante"),
  });
}

export function useCreateOpcion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productoId,
      varianteId,
      data,
    }: {
      productoId: string;
      varianteId: string;
      data: OpcionVarianteInput;
    }) => variantsApi.createOpcion(productoId, varianteId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["variantes", variables.productoId] });
      toast.success("Opcion agregada");
    },
    onError: () => toast.error("Error al agregar opcion"),
  });
}

export function useDeleteOpcion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productoId,
      varianteId,
      opcionId,
    }: {
      productoId: string;
      varianteId: string;
      opcionId: string;
    }) => variantsApi.deleteOpcion(productoId, varianteId, opcionId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["variantes", variables.productoId] });
      toast.success("Opcion eliminada");
    },
    onError: () => toast.error("Error al eliminar opcion"),
  });
}

export function useSKUs(productoId: string) {
  return useQuery({
    queryKey: ["skus", productoId],
    queryFn: () => variantsApi.listSKUs(productoId),
    enabled: !!productoId,
  });
}

export function useCreateSKU() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SKUVarianteInput) => variantsApi.createSKU(data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skus", variables.producto_id] });
      toast.success("SKU creado");
    },
    onError: () => toast.error("Error al crear SKU"),
  });
}

export function useUpdateSKU() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productoId,
      id,
      data,
    }: {
      productoId: string;
      id: string;
      data: Omit<SKUVarianteInput, "producto_id">;
    }) => variantsApi.updateSKU(productoId, id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skus", variables.productoId] });
      toast.success("SKU actualizado");
    },
    onError: () => toast.error("Error al actualizar SKU"),
  });
}

export function useDeleteSKU() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productoId, id }: { productoId: string; id: string }) =>
      variantsApi.deleteSKU(productoId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["skus", variables.productoId] });
      toast.success("SKU eliminado");
    },
    onError: () => toast.error("Error al eliminar SKU"),
  });
}
