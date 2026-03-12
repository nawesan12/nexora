"use client";

import { useRef, useLayoutEffect } from "react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface ChartEmptyStateProps {
  title?: string;
  description?: string;
  height?: string;
  variant?: "area" | "bar" | "pie";
}

function AreaBackground() {
  return (
    <svg viewBox="0 0 300 120" fill="none" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      <path
        d="M0 100 Q75 95 150 100 Q225 105 300 100 L300 120 L0 120Z"
        fill="var(--muted)"
        opacity="0.3"
      />
      <path
        d="M0 100 Q75 95 150 100 Q225 105 300 100"
        stroke="var(--muted-foreground)"
        strokeWidth="1"
        opacity="0.15"
        fill="none"
      />
    </svg>
  );
}

function BarBackground() {
  return (
    <svg viewBox="0 0 300 120" fill="none" className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
      {[40, 90, 140, 190, 240].map((x, i) => (
        <rect
          key={x}
          x={x}
          y={90 + i * 2}
          width="24"
          height={30 - i * 2}
          rx="4"
          fill="var(--muted)"
          opacity={0.3 - i * 0.04}
        />
      ))}
    </svg>
  );
}

function PieBackground() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="absolute inset-0 h-full w-full mx-auto" style={{ maxWidth: "120px" }}>
      <circle
        cx="60"
        cy="60"
        r="45"
        stroke="var(--muted)"
        strokeWidth="12"
        opacity="0.3"
        fill="none"
      />
      <path
        d="M60 15 A45 45 0 0 1 105 60"
        stroke="var(--muted-foreground)"
        strokeWidth="12"
        opacity="0.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

const backgrounds = { area: AreaBackground, bar: BarBackground, pie: PieBackground };

export function ChartEmptyState({
  title = "Sin datos disponibles",
  description = "Los datos aparecerán aquí cuando haya registros.",
  height = "280px",
  variant = "area",
}: ChartEmptyStateProps) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" },
      );
    }, ref);
    return () => ctx.revert();
  }, []);

  const Bg = backgrounds[variant];

  return (
    <div
      ref={ref}
      className={cn(
        "relative flex flex-col items-center justify-center overflow-hidden rounded-lg",
      )}
      style={{ height }}
    >
      <Bg />
      <div className="relative z-10 flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <p className="max-w-[240px] text-xs text-muted-foreground/60">
          {description}
        </p>
      </div>
    </div>
  );
}
