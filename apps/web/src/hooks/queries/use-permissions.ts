"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { permissionsApi } from "@/lib/permissions-api";

export function useRolesPermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: () => permissionsApi.listAll(),
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rol, permissions }: { rol: string; permissions: string[] }) =>
      permissionsApi.updateForRole(rol, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permisos actualizados");
    },
    onError: () => {
      toast.error("Error al actualizar permisos");
    },
  });
}

export function useResetRolePermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rol: string) => permissionsApi.resetRole(rol),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permisos restablecidos");
    },
    onError: () => {
      toast.error("Error al restablecer permisos");
    },
  });
}
