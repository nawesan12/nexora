import { api } from "@/lib/api-client";
import type { Notificacion } from "@pronto/shared/types";

interface ListNotificacionesParams {
  page?: number;
  pageSize?: number;
}

export const notificationsApi = {
  list: ({ page = 1, pageSize = 20 }: ListNotificacionesParams = {}) => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    return api.getWithMeta<Notificacion[]>(`/api/v1/notificaciones?${params}`);
  },
  getUnreadCount: () => api.get<{ count: number }>("/api/v1/notificaciones/count"),
  markAsRead: (id: string) => api.patch<Notificacion>(`/api/v1/notificaciones/${id}/leer`),
  markAllAsRead: () => api.patch<void>("/api/v1/notificaciones/leer-todas"),
};
