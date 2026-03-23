import { api } from "@/lib/api-client";
import type {
  ComprobanteList,
  ComprobanteDetail,
} from "@pronto/shared/types";
import type {
  CreateFromPedidoInput,
  CreateManualComprobanteInput,
} from "@pronto/shared/schemas";

interface ListFacturasParams {
  page?: number;
  pageSize?: number;
  search?: string;
  estado?: string;
  cliente_id?: string;
}

export const facturasApi = {
  list: ({ page = 1, pageSize = 20, search, estado, cliente_id }: ListFacturasParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (search) params.set("search", search);
    if (estado) params.set("estado", estado);
    if (cliente_id) params.set("cliente_id", cliente_id);
    return api.getWithMeta<ComprobanteList[]>(`/api/v1/facturas?${params}`);
  },
  get: (id: string) => api.get<ComprobanteDetail>(`/api/v1/facturas/${id}`),
  createFromPedido: (data: CreateFromPedidoInput) =>
    api.post<ComprobanteDetail>("/api/v1/facturas/from-pedido", data),
  createManual: (data: CreateManualComprobanteInput) =>
    api.post<ComprobanteDetail>("/api/v1/facturas", data),
  emit: (id: string) =>
    api.patch<ComprobanteDetail>(`/api/v1/facturas/${id}/emitir`),
  void: (id: string) =>
    api.patch<ComprobanteDetail>(`/api/v1/facturas/${id}/anular`),
  delete: (id: string) => api.del(`/api/v1/facturas/${id}`),
  downloadPdf: async (id: string, formato?: "ticket") => {
    const params = formato ? `?formato=${formato}` : "";
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "")}/api/v1/facturas/${id}/pdf${params}`,
      { credentials: "include" },
    );
    if (!res.ok) throw new Error("Error al descargar PDF");
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
