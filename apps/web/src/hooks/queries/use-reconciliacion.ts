"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reconciliacionApi } from "@/lib/reconciliacion";
import type {
  ExtractoInput,
  ImportarMovimientosInput,
  ConciliarInput,
} from "@pronto/shared/schemas";

export function useExtractos({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["extractos", page, pageSize],
    queryFn: () => reconciliacionApi.listExtractos({ page, pageSize }),
  });
}

export function useExtracto(id: string) {
  return useQuery({
    queryKey: ["extractos", id],
    queryFn: () => reconciliacionApi.getExtracto(id),
    enabled: !!id,
  });
}

export function useCreateExtracto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ExtractoInput) =>
      reconciliacionApi.createExtracto(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["extractos"] });
      toast.success("Extracto creado");
    },
    onError: () => toast.error("Error al crear extracto"),
  });
}

export function useImportMovimientos() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ImportarMovimientosInput;
    }) => reconciliacionApi.importMovimientos(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["extractos"] });
      toast.success("Movimientos importados");
    },
    onError: () => toast.error("Error al importar movimientos"),
  });
}

export function useConciliar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      movId,
      data,
    }: {
      movId: string;
      data: ConciliarInput;
    }) => reconciliacionApi.conciliar(movId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["extractos"] });
      toast.success("Movimiento conciliado");
    },
    onError: () => toast.error("Error al conciliar"),
  });
}

export function useDescartar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (movId: string) => reconciliacionApi.descartar(movId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["extractos"] });
      toast.success("Movimiento descartado");
    },
    onError: () => toast.error("Error al descartar"),
  });
}

export function useMovCajaParaConciliar(
  id: string,
  desde: string,
  hasta: string,
) {
  return useQuery({
    queryKey: ["mov-caja-conciliar", id, desde, hasta],
    queryFn: () => reconciliacionApi.listMovCaja(id, desde, hasta),
    enabled: !!id && !!desde && !!hasta,
  });
}
