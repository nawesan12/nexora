import { api } from "@/lib/api-client";
import type { AuditLogEntry } from "@pronto/shared/types";

interface ListAuditParams {
  page?: number;
  pageSize?: number;
  entidad?: string;
  actor_id?: string;
  desde?: string;
  hasta?: string;
}

export const auditApi = {
  list: ({ page = 1, pageSize = 20, entidad, actor_id, desde, hasta }: ListAuditParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    if (entidad) params.set("entidad", entidad);
    if (actor_id) params.set("actor_id", actor_id);
    if (desde) params.set("desde", desde);
    if (hasta) params.set("hasta", hasta);
    return api.getWithMeta<AuditLogEntry[]>(`/api/v1/audit?${params}`);
  },
};
