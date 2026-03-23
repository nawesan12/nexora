import { api } from "./api-client";
import type { VarianteProducto, SKUVariante } from "@pronto/shared/types";
import type { VarianteInput, OpcionVarianteInput, SKUVarianteInput } from "@pronto/shared/schemas";

export const variantsApi = {
  listVariantes: (productoId: string) =>
    api.get<VarianteProducto[]>(`/api/v1/productos/${productoId}/variantes`),

  createVariante: (data: VarianteInput) =>
    api.post<VarianteProducto>(`/api/v1/productos/${data.producto_id}/variantes`, data),

  deleteVariante: (productoId: string, id: string) =>
    api.del(`/api/v1/productos/${productoId}/variantes/${id}`),

  createOpcion: (productoId: string, varianteId: string, data: OpcionVarianteInput) =>
    api.post(`/api/v1/productos/${productoId}/variantes/${varianteId}/opciones`, data),

  deleteOpcion: (productoId: string, varianteId: string, opcionId: string) =>
    api.del(`/api/v1/productos/${productoId}/variantes/${varianteId}/opciones/${opcionId}`),

  listSKUs: (productoId: string) =>
    api.get<SKUVariante[]>(`/api/v1/productos/${productoId}/skus`),

  createSKU: (data: SKUVarianteInput) =>
    api.post<SKUVariante>(`/api/v1/productos/${data.producto_id}/skus`, data),

  updateSKU: (productoId: string, id: string, data: Omit<SKUVarianteInput, "producto_id">) =>
    api.put<SKUVariante>(`/api/v1/productos/${productoId}/skus/${id}`, data),

  deleteSKU: (productoId: string, id: string) =>
    api.del(`/api/v1/productos/${productoId}/skus/${id}`),
};
