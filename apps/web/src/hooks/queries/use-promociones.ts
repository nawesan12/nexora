"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { promocionesApi } from "@/lib/promociones";

export function usePromociones({
  page = 1,
  pageSize = 20,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: ["promociones", page, pageSize],
    queryFn: () => promocionesApi.list({ page, pageSize }),
  });
}

export function usePromocion(id: string) {
  return useQuery({
    queryKey: ["promociones", id],
    queryFn: () => promocionesApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePromocion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => promocionesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promociones"] });
      toast.success("Promocion creada");
    },
    onError: () => toast.error("Error al crear promocion"),
  });
}

export function useUpdatePromocion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      promocionesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promociones"] });
      toast.success("Promocion actualizada");
    },
    onError: () => toast.error("Error al actualizar promocion"),
  });
}

export function useDeletePromocion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => promocionesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promociones"] });
      toast.success("Promocion eliminada");
    },
    onError: () => toast.error("Error al eliminar promocion"),
  });
}
