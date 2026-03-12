"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { BranchSelector } from "./branch-selector";
import { CurrencyToggle } from "./currency-toggle";
import { useUserStore } from "@/store/user-store";

const labels: Record<string, string> = {
  dashboard: "Dashboard",
  ventas: "Ventas",
  pedidos: "Pedidos",
  clientes: "Clientes",
  inventario: "Inventario",
  productos: "Productos",
  logistica: "Logistica",
  repartos: "Repartos",
  finanzas: "Finanzas",
  cajas: "Cajas",
  cheques: "Cheques",
  gastos: "Gastos",
  "metodos-pago": "Métodos de Pago",
  presupuestos: "Presupuestos",
  comisiones: "Comisiones",
  "entidades-bancarias": "Entidades Bancarias",
  nuevo: "Nuevo",
  movimientos: "Movimientos",
  arqueos: "Arqueos",
  recurrentes: "Recurrentes",
  empleados: "Empleados",
  reportes: "Reportes",
  configuracion: "Configuracion",
};

export function AppHeader() {
  const pathname = usePathname();
  const user = useUserStore((s) => s.user);

  const segments = pathname.split("/").filter(Boolean);
  const currentSegment = segments[segments.length - 1];
  const pageTitle = currentSegment ? (labels[currentSegment] || currentSegment) : "Dashboard";

  const breadcrumbTrail = segments.length > 1
    ? segments.map((s) => labels[s] || s).join(" / ")
    : null;

  const initials = user
    ? `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`.toUpperCase()
    : "?";
  const fullName = user ? `${user.nombre} ${user.apellido}` : "";

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-sm shadow-xs px-4">
      <SidebarTrigger className="size-8" />

      <div className="flex flex-col justify-center min-w-0">
        <h1 className="text-base font-semibold leading-tight truncate">
          {pageTitle}
        </h1>
        {breadcrumbTrail && (
          <span className="hidden md:block text-xs text-muted-foreground truncate">
            {breadcrumbTrail}
          </span>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <BranchSelector />
        <CurrencyToggle />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="size-8 cursor-default">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{fullName}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
}
