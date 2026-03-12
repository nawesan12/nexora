"use client";

import { useEffect, useRef } from "react";

export default function Loading() {
  const logoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Smooth breathing animation on the logo
    const el = logoRef.current;
    if (!el) return;
    let frame: number;
    let t = 0;
    function animate() {
      t += 0.03;
      if (el) {
        const scale = 1 + Math.sin(t) * 0.05;
        const opacity = 0.7 + Math.sin(t) * 0.3;
        el.style.transform = `scale(${scale})`;
        el.style.opacity = `${opacity}`;
      }
      frame = requestAnimationFrame(animate);
    }
    animate();
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className="space-y-6">
      {/* Branded loading indicator */}
      <div className="flex items-center gap-4 py-2">
        <div
          ref={logoRef}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-400 to-indigo-600 text-base font-bold text-white shadow-lg shadow-violet-500/20"
        >
          N
        </div>
        <div className="space-y-1.5">
          <div className="h-7 w-44 animate-pulse rounded-lg bg-muted" />
          <div className="h-3.5 w-64 animate-pulse rounded-md bg-muted/50" />
        </div>
      </div>

      {/* Summary bar skeleton */}
      <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-gradient-to-r from-[var(--accent)]/3 to-transparent px-5 py-3 animate-pulse">
        <div className="h-8 w-8 rounded-lg bg-muted/40" />
        <div className="h-4 w-52 rounded bg-muted/50" />
      </div>

      {/* Toolbar skeleton */}
      <div className="flex items-center justify-between animate-pulse">
        <div className="flex items-center gap-2">
          <div className="h-9 w-64 rounded-lg bg-muted/40" />
          <div className="h-9 w-32 rounded-lg bg-muted/30" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-24 rounded-lg bg-muted/30" />
          <div className="h-9 w-20 rounded-lg bg-muted/30" />
        </div>
      </div>

      {/* DataTable skeleton */}
      <div className="rounded-xl bg-card shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="flex items-center gap-4 border-b border-border/30 px-4 py-3 animate-pulse">
          <div className="h-4 w-4 rounded bg-muted/40" />
          <div className="h-3 w-24 rounded bg-muted/50" />
          <div className="h-3 w-16 rounded bg-muted/40 ml-auto" />
          <div className="h-3 w-20 rounded bg-muted/40" />
          <div className="h-3 w-16 rounded bg-muted/40" />
          <div className="h-3 w-20 rounded bg-muted/40" />
          <div className="h-3 w-12 rounded bg-muted/40" />
        </div>

        {/* Data rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/20 px-4 py-3.5 animate-pulse"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className="h-4 w-4 rounded bg-muted/30" />
            <div className="flex items-center gap-3 flex-1">
              <div className="h-9 w-9 shrink-0 rounded-full bg-muted/30" />
              <div className="space-y-1.5 flex-1">
                <div
                  className="h-4 rounded bg-muted/40"
                  style={{ width: `${140 + (i % 3) * 40}px` }}
                />
                <div
                  className="h-3 rounded bg-muted/25"
                  style={{ width: `${100 + (i % 4) * 30}px` }}
                />
              </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-muted/30" />
            <div className="h-4 w-20 rounded bg-muted/25" />
            <div className="h-4 w-16 rounded bg-muted/25" />
            <div className="h-8 w-8 rounded bg-muted/20" />
          </div>
        ))}

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between border-t border-border/30 px-4 py-3 animate-pulse">
          <div className="h-4 w-36 rounded bg-muted/40" />
          <div className="flex items-center gap-1">
            <div className="h-8 w-8 rounded bg-muted/30" />
            <div className="h-8 w-8 rounded bg-muted/30" />
            <div className="h-8 w-8 rounded bg-[var(--accent)]/15" />
            <div className="h-8 w-8 rounded bg-muted/30" />
            <div className="h-8 w-8 rounded bg-muted/30" />
          </div>
        </div>
      </div>
    </div>
  );
}
