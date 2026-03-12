"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { label: "Resumen", href: "/finanzas" },
  { label: "Cajas", href: "/finanzas/cajas" },
  { label: "Cheques", href: "/finanzas/cheques" },
  { label: "Gastos", href: "/finanzas/gastos" },
  { label: "Gastos Recurrentes", href: "/finanzas/gastos-recurrentes" },
  { label: "Métodos de Pago", href: "/finanzas/metodos-pago" },
  { label: "Presupuestos", href: "/finanzas/presupuestos" },
  { label: "Comisiones", href: "/finanzas/comisiones" },
  { label: "Entidades Bancarias", href: "/finanzas/entidades-bancarias" },
];

export default function FinanzasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Finanzas</h1>
        <p className="text-muted-foreground">Gestión financiera</p>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-b">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
              pathname === tab.href
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
