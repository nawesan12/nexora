"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Settings, User, Search, Command } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import { filterNavByPermissions } from "@/config/navigation";
import { authApi } from "@/lib/auth";
import { ROLE_LABELS } from "@nexora/shared/constants";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Rol } from "@nexora/shared/constants";
import { cn } from "@/lib/utils";

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const role = (user?.rol || "ADMIN") as Rol;
  const permissions = user?.permissions ?? [];
  const sections = filterNavByPermissions(permissions);

  const initials = user
    ? `${user.nombre[0]}${user.apellido[0]}`.toUpperCase()
    : "?";
  const roleLabel = ROLE_LABELS[role] || role;

  async function handleLogout() {
    try {
      await authApi.logout();
    } catch {
      // continue
    }
    clearUser();
    router.replace("/login");
  }

  return (
    <Sidebar>
      {/* Logo + Brand */}
      <SidebarHeader className="px-5 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 transition-opacity hover:opacity-80"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-base font-bold text-white shadow-lg shadow-violet-500/25">
            N
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold leading-tight tracking-tight text-sidebar-foreground">
              Nexora
            </span>
            <span className="text-[11px] font-medium uppercase tracking-widest text-sidebar-foreground/40">
              ERP System
            </span>
          </div>
        </Link>
      </SidebarHeader>

      {/* Search hint */}
      <div className="px-4 pb-3">
        <button className="flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border/50 bg-sidebar-accent/30 px-3.5 py-2.5 text-sm text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground/70">
          <Search className="h-4 w-4" />
          <span>Buscar...</span>
          <kbd className="ml-auto flex items-center gap-0.5 rounded-md border border-sidebar-border/50 bg-sidebar-accent/50 px-1.5 py-0.5 font-mono text-[11px] text-sidebar-foreground/40">
            <Command className="h-3 w-3" />K
          </kbd>
        </button>
      </div>

      {/* Navigation */}
      <SidebarContent className="px-4">
        <nav className="space-y-6">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                {section.title}
              </h3>
              <ul className="space-y-1">
                {section.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/40 hover:text-sidebar-foreground",
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-[18px] w-[18px] shrink-0 transition-colors",
                            isActive
                              ? "text-violet-400"
                              : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/60",
                          )}
                        />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-500/20 px-1.5 text-[11px] font-semibold text-violet-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </SidebarContent>

      {/* User profile footer */}
      <SidebarFooter className="border-t border-sidebar-border/50 p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-sidebar-accent/40">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400/20 to-indigo-500/20 text-sm font-semibold text-violet-300 ring-1 ring-violet-400/20">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium leading-tight text-sidebar-foreground">
                  {user?.nombre} {user?.apellido}
                </p>
                <p className="truncate text-xs text-sidebar-foreground/40">
                  {roleLabel}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/30" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            side="top"
            className="w-[--radix-dropdown-menu-trigger-width]"
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {user?.nombre} {user?.apellido}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/configuracion/perfil")}
            >
              <User className="mr-2 h-4 w-4" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/configuracion")}>
              <Settings className="mr-2 h-4 w-4" />
              Configuracion
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
