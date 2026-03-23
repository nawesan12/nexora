"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { empresaApi } from "@/lib/empresa";
import type { ConfiguracionEmpresaInput } from "@pronto/shared/schemas";

export function useConfiguracionEmpresa() {
  return useQuery({
    queryKey: ["configuracion-empresa"],
    queryFn: () => empresaApi.get(),
  });
}

export function useUpsertConfiguracionEmpresa() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ConfiguracionEmpresaInput) => empresaApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["configuracion-empresa"] });
      toast.success("Configuracion de empresa guardada");
    },
    onError: () => toast.error("Error al guardar configuracion"),
  });
}
