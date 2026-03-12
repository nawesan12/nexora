"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { movimientosStockApi } from "@/lib/stock";

export function useMovimientosStock({
  page = 1,
  pageSize = 20,
  productoId,
  sucursalId,
  tipo,
  fechaDesde,
  fechaHasta,
}: {
  page?: number;
  pageSize?: number;
  productoId?: string;
  sucursalId?: string;
  tipo?: string;
  fechaDesde?: string;
  fechaHasta?: string;
} = {}) {
  return useQuery({
    queryKey: [
      "movimientos-stock",
      page,
      pageSize,
      productoId,
      sucursalId,
      tipo,
      fechaDesde,
      fechaHasta,
    ],
    queryFn: () =>
      movimientosStockApi.list({
        page,
        pageSize,
        producto_id: productoId,
        sucursal_id: sucursalId,
        tipo,
        fecha_desde: fechaDesde,
        fecha_hasta: fechaHasta,
      }),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      producto_id: string;
      sucursal_id: string;
      cantidad: number;
      tipo: string;
      motivo: string;
    }) => movimientosStockApi.adjust(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimientos-stock"] });
      toast.success("Ajuste de stock registrado");
    },
    onError: () => toast.error("Error al ajustar stock"),
  });
}
