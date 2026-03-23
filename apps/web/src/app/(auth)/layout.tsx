"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orbs = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Subtle floating animation for orbs
    const el = orbs.current;
    if (!el) return;
    let frame: number;
    let t = 0;
    function animate() {
      t += 0.005;
      if (el) {
        const children = el.children as HTMLCollectionOf<HTMLElement>;
        for (let i = 0; i < children.length; i++) {
          const offset = i * 2.1;
          children[i].style.transform = `translate(${Math.sin(t + offset) * 20}px, ${Math.cos(t + offset) * 15}px)`;
        }
      }
      frame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[#134E4A] via-[#1A6B64] to-[#0D3D38] lg:flex lg:flex-col lg:justify-between">
        {/* Floating orbs */}
        <div ref={orbs} className="pointer-events-none absolute inset-0">
          <div className="absolute left-[15%] top-[20%] h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="absolute right-[10%] top-[50%] h-48 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute bottom-[15%] left-[30%] h-56 w-56 rounded-full bg-amber-500/8 blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-lg font-bold text-white shadow-lg shadow-black/10 ring-1 ring-white/10">
              P
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Pronto</span>
              <span className="ml-2 text-[11px] font-medium uppercase tracking-widest text-white/40">ERP</span>
            </div>
          </div>

          {/* Feature highlight */}
          <div className="space-y-8 max-w-md">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
                Tu negocio,{" "}
                <span className="bg-gradient-to-r from-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  al instante.
                </span>
              </h2>
              <p className="mt-3 text-base text-teal-200/70 leading-relaxed">
                Gestiona tu empresa de distribucion con una plataforma integral. Ventas, inventario, finanzas y logistica en un solo lugar.
              </p>
            </div>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2">
              {["Ventas", "Inventario", "Finanzas", "Logistica", "Reportes"].map((f) => (
                <span
                  key={f}
                  className="rounded-full bg-white/8 px-3.5 py-1.5 text-xs font-medium text-teal-200/80 ring-1 ring-white/10 backdrop-blur-sm"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-teal-300/40">
              &copy; {new Date().getFullYear()} Pronto. Todos los derechos reservados.
            </p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-xs text-teal-300/40 transition-colors hover:text-teal-200/70">
                Terminos
              </Link>
              <Link href="/privacy" className="text-xs text-teal-300/40 transition-colors hover:text-teal-200/70">
                Privacidad
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-background p-4 sm:p-8">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-teal-700 text-sm font-bold text-white shadow-lg shadow-teal-500/25">
            P
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">Pronto</span>
        </div>

        <div className="w-full max-w-[420px]">{children}</div>
      </div>
    </div>
  );
}
