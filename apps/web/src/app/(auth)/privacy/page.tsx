import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/10">
          <Shield className="h-7 w-7 text-[var(--accent)]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Politica de Privacidad
        </h1>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground text-center py-8">
          Proximamente.
        </p>
      </div>

      <p className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Volver al login
        </Link>
      </p>
    </div>
  );
}
