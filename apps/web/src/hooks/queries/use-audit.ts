"use client";

import { useQuery } from "@tanstack/react-query";
import { auditApi } from "@/lib/audit";

export function useAuditLog({
  page = 1,
  pageSize = 20,
  entidad,
  actor_id,
  desde,
  hasta,
}: {
  page?: number;
  pageSize?: number;
  entidad?: string;
  actor_id?: string;
  desde?: string;
  hasta?: string;
} = {}) {
  return useQuery({
    queryKey: ["audit-log", page, pageSize, entidad, actor_id, desde, hasta],
    queryFn: () => auditApi.list({ page, pageSize, entidad, actor_id, desde, hasta }),
  });
}
