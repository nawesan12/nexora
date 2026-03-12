import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";
import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Demo
        </h1>
        <p className="text-sm text-muted-foreground">
          Explora Nexora sin necesidad de crear una cuenta
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-5 py-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/10">
            <PlayCircle className="h-8 w-8 text-[var(--accent)]" />
          </div>
          <div className="text-center space-y-1">
            <p className="font-semibold text-foreground">Proximamente</p>
            <p className="text-sm text-muted-foreground max-w-xs">
              Estamos preparando un entorno de demostracion. Mientras tanto, podes registrarte para probarlo.
            </p>
          </div>
          <Button asChild className="h-10">
            <Link href="/register">Crear Cuenta Gratis</Link>
          </Button>
        </div>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Ya tenes cuenta?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Iniciar Sesion
        </Link>
      </p>
    </div>
  );
}
