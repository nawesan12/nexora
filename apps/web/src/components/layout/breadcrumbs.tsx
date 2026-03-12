"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

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

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = "/" + segments.slice(0, index + 1).join("/");
          const label = labels[segment] || segment;
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={href}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
