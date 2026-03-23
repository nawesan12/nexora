"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { conveniosApi, type ConvenioInput } from "@/lib/convenios";

export function useConvenios({ page, pageSize }: { page?: number; pageSize?: number } = {}) {
  return useQuery({
    queryKey: ["convenios", page, pageSize],
    queryFn: () => conveniosApi.list({ page, pageSize }),
  });
}

export function useConvenio(id: string) {
  return useQuery({
    queryKey: ["convenios", id],
    queryFn: () => conveniosApi.get(id),
    enabled: !!id,
  });
}

export function useCreateConvenio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ConvenioInput) => conveniosApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["convenios"] }); toast.success("Convenio creado"); },
    onError: () => toast.error("Error al crear convenio"),
  });
}

export function useUpdateConvenio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ConvenioInput }) => conveniosApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["convenios"] }); toast.success("Convenio actualizado"); },
    onError: () => toast.error("Error al actualizar convenio"),
  });
}

export function useDeleteConvenio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conveniosApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["convenios"] }); toast.success("Convenio eliminado"); },
    onError: () => toast.error("Error al eliminar convenio"),
  });
}
