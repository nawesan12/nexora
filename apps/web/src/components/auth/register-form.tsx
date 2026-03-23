"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  registerStep1Schema,
  registerStep2Schema,
  registerStep3Schema,
  type RegisterStep1Input,
  type RegisterStep2Input,
  type RegisterStep3Input,
} from "@pronto/shared/schemas";
import { authApi } from "@/lib/auth";
import { useUserStore } from "@/store/user-store";
import { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordStrength } from "./password-strength";
import { User, Mail, Lock, Building2, ArrowRight, ArrowLeft, Loader2, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Personal", icon: User },
  { label: "Cuenta", icon: Lock },
  { label: "Empresa", icon: Building2 },
];

export function RegisterForm() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    empresa: "",
  });

  const step1Form = useForm<RegisterStep1Input>({
    resolver: zodResolver(registerStep1Schema),
    defaultValues: { nombre: formData.nombre, apellido: formData.apellido },
  });

  const step2Form = useForm<RegisterStep2Input>({
    resolver: zodResolver(registerStep2Schema),
    defaultValues: {
      email: formData.email,
      password: "",
      confirmPassword: "",
    },
  });

  const step3Form = useForm<RegisterStep3Input>({
    resolver: zodResolver(registerStep3Schema),
    defaultValues: { empresa: formData.empresa },
  });

  function onStep1(data: RegisterStep1Input) {
    setFormData((prev) => ({ ...prev, ...data }));
    setStep(2);
  }

  function onStep2(data: RegisterStep2Input) {
    setFormData((prev) => ({
      ...prev,
      email: data.email,
      password: data.password,
    }));
    setStep(3);
  }

  async function onStep3(data: RegisterStep3Input) {
    setLoading(true);
    const finalData = { ...formData, ...data };
    try {
      const user = await authApi.register(finalData);
      setUser(user);
      toast.success("Cuenta creada exitosamente");
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Error al registrar";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Crear Cuenta
        </h1>
        <p className="text-sm text-muted-foreground">
          Configura tu cuenta en 3 simples pasos
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-3">
        {STEPS.map((s, i) => {
          const stepNum = i + 1;
          const isComplete = step > stepNum;
          const isCurrent = step === stepNum;
          return (
            <div key={s.label} className="flex items-center gap-3">
              {i > 0 && (
                <div
                  className={cn(
                    "h-px w-8 transition-colors",
                    isComplete ? "bg-[var(--accent)]" : "bg-border",
                  )}
                />
              )}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-all",
                    isComplete
                      ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/25"
                      : isCurrent
                        ? "bg-[var(--accent)]/10 text-[var(--accent)] ring-2 ring-[var(--accent)]/30"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-wider",
                    isCurrent ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {step === 1 && (
          <form
            onSubmit={step1Form.handleSubmit(onStep1)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="nombre" className="text-sm font-medium">Nombre</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="nombre"
                  className="pl-9"
                  placeholder="Tu nombre"
                  {...step1Form.register("nombre")}
                />
              </div>
              {step1Form.formState.errors.nombre && (
                <p className="text-sm text-destructive">
                  {step1Form.formState.errors.nombre.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="apellido" className="text-sm font-medium">Apellido</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="apellido"
                  className="pl-9"
                  placeholder="Tu apellido"
                  {...step1Form.register("apellido")}
                />
              </div>
              {step1Form.formState.errors.apellido && (
                <p className="text-sm text-destructive">
                  {step1Form.formState.errors.apellido.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full h-10">
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={step2Form.handleSubmit(onStep2)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="tu@email.com"
                  {...step2Form.register("email")}
                />
              </div>
              {step2Form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {step2Form.formState.errors.email.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Contrasena</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  {...step2Form.register("password")}
                />
              </div>
              {step2Form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {step2Form.formState.errors.password.message}
                </p>
              )}
              <PasswordStrength password={step2Form.watch("password") || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contrasena</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="confirmPassword"
                  type="password"
                  className="pl-9"
                  {...step2Form.register("confirmPassword")}
                />
              </div>
              {step2Form.formState.errors.confirmPassword && (
                <p className="text-sm text-destructive">
                  {step2Form.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setStep(1)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atras
              </Button>
              <Button type="submit" className="flex-1 h-10">
                Siguiente
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form
            onSubmit={step3Form.handleSubmit(onStep3)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="empresa" className="text-sm font-medium">Nombre de la Empresa</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  id="empresa"
                  className="pl-9"
                  placeholder="Nombre de tu empresa"
                  {...step3Form.register("empresa")}
                />
              </div>
              {step3Form.formState.errors.empresa && (
                <p className="text-sm text-destructive">
                  {step3Form.formState.errors.empresa.message}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-10"
                onClick={() => setStep(2)}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Atras
              </Button>
              <Button type="submit" className="flex-1 h-10" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </div>
          </form>
        )}
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
