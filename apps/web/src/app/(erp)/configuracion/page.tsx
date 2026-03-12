"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Calculator,
  CreditCard,
  Landmark,
  Shield,
  FileCheck,
} from "lucide-react";
import gsap from "gsap";

const settingsCards = [
  {
    title: "Sucursales",
    description: "Administra las sucursales de tu empresa",
    href: "/configuracion/sucursales",
    icon: Building2,
    color: "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-950/50",
  },
  {
    title: "Impuestos",
    description: "Configura IVA, IIBB y otros impuestos aplicables",
    href: "/configuracion/impuestos",
    icon: Calculator,
    color: "text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-950/50",
  },
  {
    title: "Metodos de Pago",
    description: "Define los metodos de pago aceptados",
    href: "/configuracion/metodos-pago",
    icon: CreditCard,
    color: "text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/50",
  },
  {
    title: "Entidades Bancarias",
    description: "Gestiona cuentas y entidades bancarias",
    href: "/configuracion/entidades-bancarias",
    icon: Landmark,
    color: "text-violet-600 bg-violet-100 dark:text-violet-400 dark:bg-violet-950/50",
  },
  {
    title: "Permisos",
    description: "Configura los permisos por rol de usuario",
    href: "/configuracion/permisos",
    icon: Shield,
    color: "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-950/50",
  },
  {
    title: "AFIP",
    description: "Configuracion de facturacion electronica AFIP",
    href: "/configuracion/afip",
    icon: FileCheck,
    color: "text-sky-600 bg-sky-100 dark:text-sky-400 dark:bg-sky-950/50",
  },
];

export default function ConfiguracionPage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".config-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".config-card",
        { y: 20, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.4,
          stagger: 0.07,
          delay: 0.15,
          ease: "power3.out",
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="config-header space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Configuracion
        </h1>
        <p className="text-sm text-muted-foreground">
          Administra la configuracion general del sistema
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settingsCards.map((card) => (
          <Link key={card.href} href={card.href}>
            <Card className="config-card group cursor-pointer border-0 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="flex items-start gap-4 p-6">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${card.color}`}
                >
                  <card.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground group-hover:text-[var(--accent)] transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
