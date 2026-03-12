"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Check, Circle } from "lucide-react";

interface PasswordStrengthProps {
  password: string;
}

const criteria = [
  { label: "Al menos 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Una letra mayuscula", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Una letra minuscula", test: (p: string) => /[a-z]/.test(p) },
  { label: "Un numero", test: (p: string) => /[0-9]/.test(p) },
  {
    label: "Un caracter especial",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

const STRENGTH_LABELS = ["", "Muy debil", "Debil", "Aceptable", "Buena", "Excelente"];
const STRENGTH_COLORS = [
  "bg-muted",
  "bg-red-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-500",
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const results = useMemo(
    () => criteria.map((c) => ({ ...c, passed: c.test(password) })),
    [password],
  );

  const score = results.filter((r) => r.passed).length;

  if (!password) return null;

  return (
    <div className="space-y-3 pt-1">
      {/* Strength bar */}
      <div className="space-y-1.5">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-all duration-300",
                i < score ? STRENGTH_COLORS[score] : "bg-muted",
              )}
            />
          ))}
        </div>
        <p
          className={cn(
            "text-[11px] font-medium transition-colors",
            score <= 2 ? "text-muted-foreground" : "text-emerald-600 dark:text-emerald-400",
          )}
        >
          {STRENGTH_LABELS[score]}
        </p>
      </div>

      {/* Criteria checklist */}
      <ul className="space-y-1">
        {results.map((r) => (
          <li
            key={r.label}
            className={cn(
              "flex items-center gap-2 text-xs transition-colors",
              r.passed
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {r.passed ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <Circle className="h-3 w-3 shrink-0" />
            )}
            {r.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
