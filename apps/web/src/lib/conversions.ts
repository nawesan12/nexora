import { api } from "@/lib/api-client";
import type { ConversionUnidad, ConvertResult } from "@pronto/shared/types";
import type { ConversionInput } from "@pronto/shared/schemas";

interface ListConversionsParams {
  page?: number;
  pageSize?: number;
}

export const conversionsApi = {
  list: ({ page = 1, pageSize = 50 }: ListConversionsParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<ConversionUnidad[]>(`/api/v1/configuracion/conversiones?${params}`);
  },
  create: (data: ConversionInput) =>
    api.post<ConversionUnidad>("/api/v1/configuracion/conversiones", data),
  update: (id: string, data: { factor: number }) =>
    api.put<ConversionUnidad>(`/api/v1/configuracion/conversiones/${id}`, data),
  delete: (id: string) => api.del(`/api/v1/configuracion/conversiones/${id}`),
  convert: (from: string, to: string, qty: number) =>
    api.get<ConvertResult>(`/api/v1/configuracion/conversiones/convert?from=${from}&to=${to}&qty=${qty}`),
};
