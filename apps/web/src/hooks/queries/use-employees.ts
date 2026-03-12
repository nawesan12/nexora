"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { empleadosApi } from "@/lib/employees";
import type { EmpleadoInput } from "@nexora/shared/schemas";

export function useEmpleados({
  page = 1,
  pageSize = 20,
  search,
  rol,
  estado,
  sucursalId,
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  rol?: string;
  estado?: string;
  sucursalId?: string;
} = {}) {
  return useQuery({
    queryKey: ["empleados", page, pageSize, search, rol, estado, sucursalId],
    queryFn: () =>
      empleadosApi.list({
        page,
        pageSize,
        search,
        rol,
        estado,
        sucursal_id: sucursalId,
      }),
  });
}

export function useEmpleado(id: string) {
  return useQuery({
    queryKey: ["empleados", id],
    queryFn: () => empleadosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmpleadoInput) => empleadosApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Empleado creado");
    },
    onError: () => toast.error("Error al crear empleado"),
  });
}

export function useUpdateEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmpleadoInput }) =>
      empleadosApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Empleado actualizado");
    },
    onError: () => toast.error("Error al actualizar empleado"),
  });
}

export function useDeleteEmpleado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => empleadosApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Empleado eliminado");
    },
    onError: () => toast.error("Error al eliminar empleado"),
  });
}

export function useEmpleadoBranches(id: string) {
  return useQuery({
    queryKey: ["empleado-branches", id],
    queryFn: () => empleadosApi.listBranches(id),
    enabled: !!id,
  });
}

export function useAssignEmpleadoBranches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchIds }: { id: string; branchIds: string[] }) =>
      empleadosApi.assignBranches(id, branchIds),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["empleado-branches", variables.id],
      });
      toast.success("Sucursales asignadas");
    },
    onError: () => toast.error("Error al asignar sucursales"),
  });
}

export function useRegenerateAccessCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => empleadosApi.regenerateAccessCode(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["empleados", id] });
      toast.success("Codigo de acceso regenerado");
    },
    onError: () => toast.error("Error al regenerar codigo de acceso"),
  });
}

export function useBulkUpdateEstado() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, estado }: { ids: string[]; estado: string }) =>
      empleadosApi.bulkUpdateEstado(ids, estado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Estado actualizado");
    },
    onError: () => toast.error("Error al actualizar estado"),
  });
}

export function useBulkUpdateRol() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, rol }: { ids: string[]; rol: string }) =>
      empleadosApi.bulkUpdateRol(ids, rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Rol actualizado");
    },
    onError: () => toast.error("Error al actualizar rol"),
  });
}

export function useBulkAssignBranches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      ids,
      branchIds,
    }: {
      ids: string[];
      branchIds: string[];
    }) => empleadosApi.bulkAssignBranches(ids, branchIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empleados"] });
      toast.success("Sucursales asignadas");
    },
    onError: () => toast.error("Error al asignar sucursales"),
  });
}
