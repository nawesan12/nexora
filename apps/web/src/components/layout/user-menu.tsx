"use client";

import { useRouter } from "next/navigation";
import { LogOut, User, Settings } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { authApi } from "@/lib/auth";
import { ROLE_LABELS } from "@nexora/shared/constants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Rol } from "@nexora/shared/constants";

export function UserMenu() {
  const router = useRouter();
  const { user, clearUser } = useUserStore();

  if (!user) return null;

  const initials = `${user.nombre[0]}${user.apellido[0]}`.toUpperCase();
  const roleLabel = ROLE_LABELS[user.rol as Rol] || user.rol;

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // continue anyway
    }
    clearUser();
    router.replace("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-accent/10 transition-colors">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium">
              {user.nombre} {user.apellido}
            </span>
            <span className="text-xs text-muted-foreground">{user.email}</span>
            <Badge variant="secondary" className="w-fit text-xs">
              {roleLabel}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/configuracion/perfil")}>
          <User className="mr-2 h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/configuracion")}>
          <Settings className="mr-2 h-4 w-4" />
          Configuracion
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar Sesion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
