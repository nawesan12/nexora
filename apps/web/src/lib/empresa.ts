import { api } from "@/lib/api-client";
import type { ConfiguracionEmpresa } from "@pronto/shared/types";
import type { ConfiguracionEmpresaInput } from "@pronto/shared/schemas";

export const empresaApi = {
  get: () => api.get<ConfiguracionEmpresa>("/api/v1/configuracion/empresa"),
  upsert: (data: ConfiguracionEmpresaInput) =>
    api.put<ConfiguracionEmpresa>("/api/v1/configuracion/empresa", data),
};
