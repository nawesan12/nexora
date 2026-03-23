"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  useNotifications,
  useUnreadCount,
  useMarkRead,
  useMarkAllRead,
} from "@/hooks/queries/use-notifications";
import type { Notificacion } from "@pronto/shared/types";

const TIPO_COLORS: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
  ALERTA: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400",
  APROBACION: "bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400",
  STOCK_BAJO: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400",
  PAGO_VENCIDO: "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400",
  PEDIDO_NUEVO: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-teal-400",
  ENTREGA: "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
  SISTEMA: "bg-gray-100 text-gray-700 dark:bg-gray-950/50 dark:text-gray-400",
};

export function NotificationBell() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { data: countData } = useUnreadCount();
  const { data: notifData } = useNotifications({ page: 1, pageSize: 10 });
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  const count = (countData as { count: number } | undefined)?.count ?? 0;
  const notifications = (notifData?.data ?? []) as Notificacion[];

  const handleClick = (notif: Notificacion) => {
    if (!notif.leida) {
      markRead.mutate(notif.id);
    }
    if (notif.enlace) {
      router.push(notif.enlace);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-8">
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {count > 99 ? "99+" : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h4 className="text-sm font-semibold">Notificaciones</h4>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => markAllRead.mutate()}
            >
              Marcar todas como leidas
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Sin notificaciones
            </p>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleClick(notif)}
                className={`flex w-full flex-col gap-1 border-b px-4 py-3 text-left transition-colors hover:bg-muted/50 ${
                  !notif.leida ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <Badge
                    variant="secondary"
                    className={`border-0 text-[10px] font-medium ${TIPO_COLORS[notif.tipo] || TIPO_COLORS.SISTEMA}`}
                  >
                    {notif.tipo}
                  </Badge>
                  {!notif.leida && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </div>
                <p className="text-sm font-medium leading-tight">
                  {notif.titulo}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {notif.mensaje}
                </p>
                <p className="text-[10px] text-muted-foreground/70">
                  {new Date(notif.created_at).toLocaleString("es-AR", {
                    day: "numeric",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
