"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  cajasApi,
  movimientosApi,
  arqueosApi,
  chequesApi,
  gastosApi,
  gastosRecurrentesApi,
  metodosPagoApi,
  presupuestosApi,
  comisionesApi,
  entidadesBancariasApi,
  financeResumenApi,
} from "@/lib/finance";
import type {
  CajaInput, MovimientoInput, ArqueoInput, ChequeInput,
  TransicionChequeInput, GastoInput, GastoRecurrenteInput,
  MetodoPagoInput, PresupuestoInput, ConfiguracionComisionInput,
  EntidadBancariaInput,
} from "@nexora/shared/schemas";

// --- Cajas ---

export function useCajas({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["cajas", page, pageSize],
    queryFn: () => cajasApi.list({ page, pageSize }),
  });
}

export function useCaja(id: string) {
  return useQuery({
    queryKey: ["cajas", id],
    queryFn: () => cajasApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CajaInput) => cajasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cajas"] });
      toast.success("Caja creada");
    },
    onError: () => toast.error("Error al crear caja"),
  });
}

export function useUpdateCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CajaInput }) =>
      cajasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cajas"] });
      toast.success("Caja actualizada");
    },
    onError: () => toast.error("Error al actualizar caja"),
  });
}

export function useDeleteCaja() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cajasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cajas"] });
      toast.success("Caja eliminada");
    },
    onError: () => toast.error("Error al eliminar caja"),
  });
}

// --- Movimientos ---

export function useMovimientosByCaja({
  cajaId,
  page = 1,
  pageSize = 20,
}: {
  cajaId: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["movimientos", cajaId, page, pageSize],
    queryFn: () => movimientosApi.listByCaja({ cajaId, page, pageSize }),
    enabled: !!cajaId,
  });
}

export function useCreateMovimiento() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cajaId, data }: { cajaId: string; data: MovimientoInput }) =>
      movimientosApi.create(cajaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["movimientos"] });
      queryClient.invalidateQueries({ queryKey: ["cajas"] });
      toast.success("Movimiento registrado");
    },
    onError: () => toast.error("Error al registrar movimiento"),
  });
}

// --- Arqueos ---

export function useArqueosByCaja({
  cajaId,
  page = 1,
  pageSize = 20,
}: {
  cajaId: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: ["arqueos", cajaId, page, pageSize],
    queryFn: () => arqueosApi.listByCaja({ cajaId, page, pageSize }),
    enabled: !!cajaId,
  });
}

export function useCreateArqueo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cajaId, data }: { cajaId: string; data: ArqueoInput }) =>
      arqueosApi.create(cajaId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arqueos"] });
      toast.success("Arqueo registrado");
    },
    onError: () => toast.error("Error al registrar arqueo"),
  });
}

export function useUpdateArqueoEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cajaId,
      arqueoId,
      estado,
    }: {
      cajaId: string;
      arqueoId: string;
      estado: string;
    }) => arqueosApi.updateEstado(cajaId, arqueoId, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["arqueos"] });
      toast.success("Estado de arqueo actualizado");
    },
    onError: () => toast.error("Error al actualizar estado de arqueo"),
  });
}

// --- Cheques ---

export function useCheques({
  page = 1,
  pageSize = 20,
  search,
  estado,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
} = {}) {
  return useQuery({
    queryKey: ["cheques", page, pageSize, search, estado],
    queryFn: () => chequesApi.list({ page, pageSize, search, estado }),
  });
}

export function useCheque(id: string) {
  return useQuery({
    queryKey: ["cheques", id],
    queryFn: () => chequesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ChequeInput) => chequesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheques"] });
      toast.success("Cheque registrado");
    },
    onError: () => toast.error("Error al registrar cheque"),
  });
}

export function useUpdateCheque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ChequeInput }) =>
      chequesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheques"] });
      toast.success("Cheque actualizado");
    },
    onError: () => toast.error("Error al actualizar cheque"),
  });
}

export function useUpdateChequeEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransicionChequeInput }) =>
      chequesApi.updateEstado(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cheques"] });
      toast.success("Estado del cheque actualizado");
    },
    onError: () => toast.error("Error al actualizar estado del cheque"),
  });
}

// --- Gastos ---

export function useGastos({
  page = 1,
  pageSize = 20,
  categoria,
}: {
  page?: number;
  pageSize?: number;
  categoria?: string;
} = {}) {
  return useQuery({
    queryKey: ["gastos", page, pageSize, categoria],
    queryFn: () => gastosApi.list({ page, pageSize, categoria }),
  });
}

export function useGasto(id: string) {
  return useQuery({
    queryKey: ["gastos", id],
    queryFn: () => gastosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GastoInput) => gastosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      toast.success("Gasto registrado");
    },
    onError: () => toast.error("Error al registrar gasto"),
  });
}

export function useUpdateGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GastoInput }) =>
      gastosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      toast.success("Gasto actualizado");
    },
    onError: () => toast.error("Error al actualizar gasto"),
  });
}

export function useDeleteGasto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gastosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos"] });
      toast.success("Gasto eliminado");
    },
    onError: () => toast.error("Error al eliminar gasto"),
  });
}

// --- Gastos Recurrentes ---

export function useGastosRecurrentes({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["gastos-recurrentes", page, pageSize],
    queryFn: () => gastosRecurrentesApi.list({ page, pageSize }),
  });
}

export function useCreateGastoRecurrente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: GastoRecurrenteInput) =>
      gastosRecurrentesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos-recurrentes"] });
      toast.success("Gasto recurrente creado");
    },
    onError: () => toast.error("Error al crear gasto recurrente"),
  });
}

export function useUpdateGastoRecurrente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GastoRecurrenteInput }) =>
      gastosRecurrentesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos-recurrentes"] });
      toast.success("Gasto recurrente actualizado");
    },
    onError: () => toast.error("Error al actualizar gasto recurrente"),
  });
}

export function useDeleteGastoRecurrente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => gastosRecurrentesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gastos-recurrentes"] });
      toast.success("Gasto recurrente eliminado");
    },
    onError: () => toast.error("Error al eliminar gasto recurrente"),
  });
}

// --- Métodos de Pago ---

export function useMetodosPago({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["metodos-pago", page, pageSize],
    queryFn: () => metodosPagoApi.list({ page, pageSize }),
  });
}

export function useCreateMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MetodoPagoInput) => metodosPagoApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metodos-pago"] });
      toast.success("Método de pago creado");
    },
    onError: () => toast.error("Error al crear método de pago"),
  });
}

export function useUpdateMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MetodoPagoInput }) =>
      metodosPagoApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metodos-pago"] });
      toast.success("Método de pago actualizado");
    },
    onError: () => toast.error("Error al actualizar método de pago"),
  });
}

export function useDeleteMetodoPago() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => metodosPagoApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["metodos-pago"] });
      toast.success("Método de pago eliminado");
    },
    onError: () => toast.error("Error al eliminar método de pago"),
  });
}

// --- Presupuestos ---

export function usePresupuestos({
  page = 1,
  pageSize = 20,
  estado,
}: {
  page?: number;
  pageSize?: number;
  estado?: string;
} = {}) {
  return useQuery({
    queryKey: ["presupuestos", page, pageSize, estado],
    queryFn: () => presupuestosApi.list({ page, pageSize, estado }),
  });
}

export function usePresupuesto(id: string) {
  return useQuery({
    queryKey: ["presupuestos", id],
    queryFn: () => presupuestosApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PresupuestoInput) => presupuestosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
      toast.success("Presupuesto creado");
    },
    onError: () => toast.error("Error al crear presupuesto"),
  });
}

export function useUpdatePresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PresupuestoInput }) =>
      presupuestosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
      toast.success("Presupuesto actualizado");
    },
    onError: () => toast.error("Error al actualizar presupuesto"),
  });
}

export function useDeletePresupuesto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => presupuestosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["presupuestos"] });
      toast.success("Presupuesto eliminado");
    },
    onError: () => toast.error("Error al eliminar presupuesto"),
  });
}

// --- Configuración de Comisiones ---

export function useConfiguracionComisiones({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["comisiones-config", page, pageSize],
    queryFn: () => comisionesApi.listConfig({ page, pageSize }),
  });
}

export function useCreateConfiguracionComision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfiguracionComisionInput) =>
      comisionesApi.createConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comisiones-config"] });
      toast.success("Configuración de comisión creada");
    },
    onError: () => toast.error("Error al crear configuración de comisión"),
  });
}

export function useUpdateConfiguracionComision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ConfiguracionComisionInput;
    }) => comisionesApi.updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comisiones-config"] });
      toast.success("Configuración de comisión actualizada");
    },
    onError: () =>
      toast.error("Error al actualizar configuración de comisión"),
  });
}

export function useDeleteConfiguracionComision() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => comisionesApi.deleteConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comisiones-config"] });
      toast.success("Configuración de comisión eliminada");
    },
    onError: () => toast.error("Error al eliminar configuración de comisión"),
  });
}

// --- Comisiones de Vendedor ---

export function useComisionesVendedor({
  page = 1,
  pageSize = 20,
  empleadoId,
}: {
  page?: number;
  pageSize?: number;
  empleadoId?: string;
} = {}) {
  return useQuery({
    queryKey: ["comisiones", page, pageSize, empleadoId],
    queryFn: () =>
      comisionesApi.listComisiones({ page, pageSize, empleadoId }),
  });
}

export function useCreateComisionVendedor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { empleado_id: string; pedido_id: string; monto: number }) =>
      comisionesApi.createComision(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comisiones"] });
      toast.success("Comisión registrada");
    },
    onError: () => toast.error("Error al registrar comisión"),
  });
}

// --- Entidades Bancarias ---

export function useEntidadesBancarias({
  page = 1,
  pageSize = 20,
}: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["entidades-bancarias", page, pageSize],
    queryFn: () => entidadesBancariasApi.list({ page, pageSize }),
  });
}

export function useCreateEntidadBancaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EntidadBancariaInput) =>
      entidadesBancariasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entidades-bancarias"] });
      toast.success("Entidad bancaria creada");
    },
    onError: () => toast.error("Error al crear entidad bancaria"),
  });
}

export function useUpdateEntidadBancaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EntidadBancariaInput }) =>
      entidadesBancariasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entidades-bancarias"] });
      toast.success("Entidad bancaria actualizada");
    },
    onError: () => toast.error("Error al actualizar entidad bancaria"),
  });
}

export function useDeleteEntidadBancaria() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => entidadesBancariasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entidades-bancarias"] });
      toast.success("Entidad bancaria eliminada");
    },
    onError: () => toast.error("Error al eliminar entidad bancaria"),
  });
}

// --- Resumen Financiero ---

export function useFinanceResumen() {
  return useQuery({
    queryKey: ["finance-resumen"],
    queryFn: () => financeResumenApi.get(),
  });
}
