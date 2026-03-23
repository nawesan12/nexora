"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loyaltyApi } from "@/lib/loyalty";
import type { ProgramaFidelidadInput, AcumularPuntosInput, CanjearPuntosInput } from "@pronto/shared/schemas";

export function usePrograma() {
  return useQuery({
    queryKey: ["loyalty-programa"],
    queryFn: () => loyaltyApi.getPrograma(),
    retry: false,
  });
}

export function useUpsertPrograma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProgramaFidelidadInput) => loyaltyApi.upsertPrograma(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-programa"] });
      toast.success("Programa de fidelidad guardado");
    },
    onError: () => toast.error("Error al guardar programa de fidelidad"),
  });
}

export function useClientePuntos(clienteId: string) {
  return useQuery({
    queryKey: ["loyalty-puntos", clienteId],
    queryFn: () => loyaltyApi.getClientePuntos(clienteId),
    enabled: !!clienteId,
  });
}

export function useLoyaltyMovimientos({ clienteId, page = 1, pageSize = 20 }: { clienteId: string; page?: number; pageSize?: number }) {
  return useQuery({
    queryKey: ["loyalty-movimientos", clienteId, page, pageSize],
    queryFn: () => loyaltyApi.listMovimientos({ clienteId, page, pageSize }),
    enabled: !!clienteId,
  });
}

export function useAcumularPuntos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, data }: { clienteId: string; data: AcumularPuntosInput }) =>
      loyaltyApi.acumular(clienteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-puntos"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-movimientos"] });
      toast.success("Puntos acumulados");
    },
    onError: () => toast.error("Error al acumular puntos"),
  });
}

export function useCanjearPuntos() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ clienteId, data }: { clienteId: string; data: CanjearPuntosInput }) =>
      loyaltyApi.canjear(clienteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["loyalty-puntos"] });
      queryClient.invalidateQueries({ queryKey: ["loyalty-movimientos"] });
      toast.success("Puntos canjeados");
    },
    onError: (err: Error) => toast.error(err.message || "Error al canjear puntos"),
  });
}
