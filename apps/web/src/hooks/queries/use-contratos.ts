"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contratosApi } from "@/lib/contratos";
import type { ContratoInput } from "@pronto/shared/schemas";

export function useContratos(
  empleadoId: string,
  { page = 1, pageSize = 20 }: { page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: ["contratos", empleadoId, page, pageSize],
    queryFn: () => contratosApi.list(empleadoId, { page, pageSize }),
    enabled: !!empleadoId,
  });
}

export function useCreateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      empleadoId,
      data,
    }: {
      empleadoId: string;
      data: ContratoInput;
    }) => contratosApi.create(empleadoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato creado");
    },
    onError: () => toast.error("Error al crear contrato"),
  });
}

export function useUpdateContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      empleadoId,
      contratoId,
      data,
    }: {
      empleadoId: string;
      contratoId: string;
      data: ContratoInput;
    }) => contratosApi.update(empleadoId, contratoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato actualizado");
    },
    onError: () => toast.error("Error al actualizar contrato"),
  });
}

export function useDeleteContrato() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      empleadoId,
      contratoId,
    }: {
      empleadoId: string;
      contratoId: string;
    }) => contratosApi.delete(empleadoId, contratoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contratos"] });
      toast.success("Contrato eliminado");
    },
    onError: () => toast.error("Error al eliminar contrato"),
  });
}
