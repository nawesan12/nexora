"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  vehiculosApi,
  zonasApi,
  repartosApi,
  eventosApi,
} from "@/lib/logistics";

// --- Vehiculos ---

export function useVehiculo(id: string) {
  return useQuery({
    queryKey: ["vehiculos", id],
    queryFn: () => vehiculosApi.get(id),
    enabled: !!id,
  });
}

export function useVehiculos({
  page = 1,
  pageSize = 50,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: ["vehiculos", page, pageSize],
    queryFn: () => vehiculosApi.list({ page, pageSize }),
  });
}

export function useCreateVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => vehiculosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
      toast.success("Vehiculo creado");
    },
    onError: () => toast.error("Error al crear vehiculo"),
  });
}

export function useUpdateVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      vehiculosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
      toast.success("Vehiculo actualizado");
    },
    onError: () => toast.error("Error al actualizar vehiculo"),
  });
}

export function useDeleteVehiculo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiculosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehiculos"] });
      toast.success("Vehiculo eliminado");
    },
    onError: () => toast.error("Error al eliminar vehiculo"),
  });
}

// --- Zonas ---

export function useZonas({
  page = 1,
  pageSize = 50,
}: {
  page?: number;
  pageSize?: number;
} = {}) {
  return useQuery({
    queryKey: ["zonas", page, pageSize],
    queryFn: () => zonasApi.list({ page, pageSize }),
  });
}

export function useCreateZona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => zonasApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
      toast.success("Zona creada");
    },
    onError: () => toast.error("Error al crear zona"),
  });
}

export function useUpdateZona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: unknown }) =>
      zonasApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
      toast.success("Zona actualizada");
    },
    onError: () => toast.error("Error al actualizar zona"),
  });
}

export function useDeleteZona() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => zonasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zonas"] });
      toast.success("Zona eliminada");
    },
    onError: () => toast.error("Error al eliminar zona"),
  });
}

// --- Repartos ---

export function useRepartos({
  page = 1,
  pageSize = 20,
  estado,
}: {
  page?: number;
  pageSize?: number;
  estado?: string;
} = {}) {
  return useQuery({
    queryKey: ["repartos", page, pageSize, estado],
    queryFn: () => repartosApi.list({ page, pageSize, estado }),
  });
}

export function useReparto(id: string) {
  return useQuery({
    queryKey: ["repartos", id],
    queryFn: () => repartosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateReparto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: unknown) => repartosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repartos"] });
      toast.success("Reparto creado");
    },
    onError: () => toast.error("Error al crear reparto"),
  });
}

export function useTransitionReparto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: { estado: string; km_inicio?: number; km_fin?: number };
    }) => repartosApi.transition(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["repartos"] });
      queryClient.invalidateQueries({
        queryKey: ["repartos", variables.id],
      });
      toast.success("Estado de reparto actualizado");
    },
    onError: () => toast.error("Error al cambiar estado de reparto"),
  });
}

export function useDeleteReparto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => repartosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["repartos"] });
      toast.success("Reparto eliminado");
    },
    onError: () => toast.error("Error al eliminar reparto"),
  });
}

// --- Eventos ---

export function useEventosReparto(repartoId: string) {
  return useQuery({
    queryKey: ["eventos-reparto", repartoId],
    queryFn: () => eventosApi.list(repartoId),
    enabled: !!repartoId,
  });
}

export function useCreateEventoReparto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      repartoId,
      data,
    }: {
      repartoId: string;
      data: unknown;
    }) => eventosApi.create(repartoId, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["eventos-reparto", variables.repartoId],
      });
      toast.success("Evento registrado");
    },
    onError: () => toast.error("Error al registrar evento"),
  });
}
