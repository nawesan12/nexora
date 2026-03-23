"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { conversionsApi } from "@/lib/conversions";
import type { ConversionInput } from "@pronto/shared/schemas";

export function useConversions({
  page = 1,
  pageSize = 50,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["conversions", page, pageSize],
    queryFn: () => conversionsApi.list({ page, pageSize }),
  });
}

export function useCreateConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConversionInput) => conversionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversions"] });
      toast.success("Conversion creada");
    },
    onError: () => toast.error("Error al crear conversion"),
  });
}

export function useUpdateConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, factor }: { id: string; factor: number }) =>
      conversionsApi.update(id, { factor }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversions"] });
      toast.success("Conversion actualizada");
    },
    onError: () => toast.error("Error al actualizar conversion"),
  });
}

export function useDeleteConversion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conversionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversions"] });
      toast.success("Conversion eliminada");
    },
    onError: () => toast.error("Error al eliminar conversion"),
  });
}

export function useConvertUnits(from: string, to: string, qty: number) {
  return useQuery({
    queryKey: ["convert", from, to, qty],
    queryFn: () => conversionsApi.convert(from, to, qty),
    enabled: !!from && !!to && qty > 0 && from !== to,
  });
}
