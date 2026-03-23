"use client";

import { useRef, useLayoutEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useUserStore } from "@/store/user-store";
import { ROLE_LABELS } from "@pronto/shared/constants";
import type { Rol } from "@pronto/shared/constants";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Lock, Building2, Loader2, Eye, EyeOff } from "lucide-react";
import gsap from "gsap";

interface PasswordForm {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export default function PerfilPage() {
  const user = useUserStore((s) => s.user);
  const role = (user?.rol || "ADMIN") as Rol;
  const roleLabel = ROLE_LABELS[role] || role;

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PasswordForm>({
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".perfil-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );
      gsap.fromTo(
        ".perfil-card",
        { y: 15, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.1,
          delay: 0.15,
        },
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const onPasswordSubmit = handleSubmit(async (data) => {
    if (data.new_password !== data.confirm_password) {
      setError("confirm_password", {
        message: "Las contrasenas no coinciden",
      });
      return;
    }

    if (data.new_password.length < 8) {
      setError("new_password", {
        message: "La contrasena debe tener al menos 8 caracteres",
      });
      return;
    }

    try {
      await api.patch("/api/v1/auth/me/password", {
        current_password: data.current_password,
        new_password: data.new_password,
      });
      toast.success("Contrasena actualizada correctamente");
      reset();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al cambiar la contrasena";
      toast.error(message);
    }
  });

  return (
    <div ref={containerRef} className="space-y-5">
      {/* Header */}
      <div className="perfil-header">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Mi Perfil
            </h1>
            <p className="text-sm text-muted-foreground">
              Informacion personal y seguridad
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: Datos Personales */}
      <Card className="perfil-card max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Datos Personales
            </h3>
          </div>
          <Separator className="mt-2 mb-4" />

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Nombre</Label>
                <p className="text-sm font-medium">{user?.nombre || "-"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Apellido</Label>
                <p className="text-sm font-medium">{user?.apellido || "-"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <p className="text-sm font-medium">{user?.email || "-"}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground">Rol</Label>
              <div>
                <Badge variant="secondary">{roleLabel}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Cambiar Contrasena */}
      <Card className="perfil-card max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Cambiar Contrasena
            </h3>
          </div>
          <Separator className="mt-2 mb-4" />

          <form onSubmit={onPasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current_password">Contrasena actual</Label>
              <div className="relative">
                <Input
                  id="current_password"
                  type={showCurrent ? "text" : "password"}
                  placeholder="Ingresa tu contrasena actual"
                  {...register("current_password", {
                    required: "Este campo es requerido",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.current_password && (
                <p className="text-sm text-destructive">
                  {errors.current_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="new_password">Nueva contrasena</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNew ? "text" : "password"}
                  placeholder="Minimo 8 caracteres"
                  {...register("new_password", {
                    required: "Este campo es requerido",
                    minLength: {
                      value: 8,
                      message: "Minimo 8 caracteres",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.new_password && (
                <p className="text-sm text-destructive">
                  {errors.new_password.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirmar contrasena</Label>
              <div className="relative">
                <Input
                  id="confirm_password"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeti la nueva contrasena"
                  {...register("confirm_password", {
                    required: "Este campo es requerido",
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirm ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="text-sm text-destructive">
                  {errors.confirm_password.message}
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Cambiar contrasena
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Section 3: Sucursales */}
      <Card className="perfil-card max-w-lg border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">
              Sucursales Asignadas
            </h3>
          </div>
          <Separator className="mt-2 mb-4" />

          {user?.sucursales && user.sucursales.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {user.sucursales.map((branch) => (
                <Badge key={branch.id} variant="outline" className="text-sm">
                  {branch.nombre}
                  {branch.tipo && (
                    <span className="ml-1 text-muted-foreground">
                      ({branch.tipo})
                    </span>
                  )}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No hay sucursales asignadas
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
