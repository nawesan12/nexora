"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authApi } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Verificacion de Email
        </h1>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--accent)]" />
            <p className="text-sm text-muted-foreground">Verificando tu email...</p>
          </div>
        )}
        {status === "success" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">Email verificado</p>
              <p className="text-sm text-muted-foreground">
                Tu email ha sido verificado correctamente.
              </p>
            </div>
            <Button asChild className="h-10">
              <Link href="/login">Iniciar Sesion</Link>
            </Button>
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="text-center space-y-1">
              <p className="font-semibold text-foreground">Verificacion fallida</p>
              <p className="text-sm text-muted-foreground">
                Token invalido o expirado.
              </p>
            </div>
            <Button variant="outline" asChild className="h-10">
              <Link href="/login">Volver al login</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
          <span className="text-sm text-muted-foreground">Cargando...</span>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
