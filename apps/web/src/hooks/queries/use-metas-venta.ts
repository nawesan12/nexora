"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { metasVentaApi } from "@/lib/metas-venta";
import type { MetaVentaInput } from "@pronto/shared/schemas";

export function useMetasVenta({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["metas-venta", page, pageSize],
    queryFn: () => metasVentaApi.list({ page, pageSize }),
  });
}

export function useMetaVenta(id: string) {
  return useQuery({
    queryKey: ["metas-venta", id],
    queryFn: () => metasVentaApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMetaVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MetaVentaInput) => metasVentaApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-venta"] });
      toast.success("Meta de venta creada");
    },
    onError: () => toast.error("Error al crear meta de venta"),
  });
}

export function useUpdateMetaVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MetaVentaInput }) =>
      metasVentaApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-venta"] });
      toast.success("Meta de venta actualizada");
    },
    onError: () => toast.error("Error al actualizar meta de venta"),
  });
}

export function useDeleteMetaVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metasVentaApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metas-venta"] });
      toast.success("Meta de venta eliminada");
    },
    onError: () => toast.error("Error al eliminar meta de venta"),
  });
}
