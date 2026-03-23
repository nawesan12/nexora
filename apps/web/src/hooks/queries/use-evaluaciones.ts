"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { evaluacionesApi } from "@/lib/evaluaciones";
import type { EvaluacionProveedorInput } from "@pronto/shared/schemas";

export function useEvaluaciones({
  proveedorId,
  page = 1,
  pageSize = 20,
}: {
  proveedorId: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["evaluaciones", proveedorId, page, pageSize],
    queryFn: () => evaluacionesApi.list({ proveedorId, page, pageSize }),
    enabled: !!proveedorId,
  });
}

export function usePromedioEvaluacion(proveedorId: string) {
  return useQuery({
    queryKey: ["evaluaciones-promedio", proveedorId],
    queryFn: () => evaluacionesApi.getPromedio(proveedorId),
    enabled: !!proveedorId,
  });
}

export function useCreateEvaluacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EvaluacionProveedorInput) =>
      evaluacionesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["evaluaciones"] });
      qc.invalidateQueries({ queryKey: ["evaluaciones-promedio"] });
      toast.success("Evaluacion registrada");
    },
    onError: () => toast.error("Error al registrar evaluacion"),
  });
}
