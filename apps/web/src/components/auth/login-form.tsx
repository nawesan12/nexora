"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  loginSchema,
  accessCodeSchema,
  type LoginInput,
  type AccessCodeInput,
} from "@nexora/shared/schemas";
import { ROLE_DEFAULT_REDIRECT } from "@nexora/shared/constants";
import { authApi } from "@/lib/auth";
import { useUserStore } from "@/store/user-store";
import { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, KeyRound, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const emailForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const codeForm = useForm<AccessCodeInput>({
    resolver: zodResolver(accessCodeSchema),
    defaultValues: { access_code: "" },
  });

  async function onEmailLogin(data: LoginInput) {
    setLoading(true);
    try {
      const user = await authApi.login(data);
      setUser(user);
      toast.success("Sesion iniciada");
      const redirect =
        ROLE_DEFAULT_REDIRECT[
          user.rol as keyof typeof ROLE_DEFAULT_REDIRECT
        ] || "/dashboard";
      router.push(redirect);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Error al iniciar sesion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function onCodeLogin(data: AccessCodeInput) {
    setLoading(true);
    try {
      const user = await authApi.loginWithAccessCode(data);
      setUser(user);
      toast.success("Sesion iniciada");
      const redirect =
        ROLE_DEFAULT_REDIRECT[
          user.rol as keyof typeof ROLE_DEFAULT_REDIRECT
        ] || "/dashboard";
      router.push(redirect);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Error al iniciar sesion";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Bienvenido de vuelta
        </h1>
        <p className="text-sm text-muted-foreground">
          Ingresa a tu cuenta para continuar
        </p>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="email" className="text-sm">
              Email
            </TabsTrigger>
            <TabsTrigger value="code" className="text-sm">
              Codigo de Acceso
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email">
            <form
              onSubmit={emailForm.handleSubmit(onEmailLogin)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@email.com"
                    className="pl-9"
                    {...emailForm.register("email")}
                  />
                </div>
                {emailForm.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contrasena
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                  >
                    Olvidaste tu contrasena?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="password"
                    type="password"
                    className="pl-9"
                    {...emailForm.register("password")}
                  />
                </div>
                {emailForm.formState.errors.password && (
                  <p className="text-sm text-destructive">
                    {emailForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {loading ? "Ingresando..." : "Iniciar Sesion"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="code">
            <form
              onSubmit={codeForm.handleSubmit(onCodeLogin)}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="access_code" className="text-sm font-medium">
                  Codigo de Acceso
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                  <Input
                    id="access_code"
                    type="text"
                    placeholder="Ingresa tu codigo"
                    className="pl-9 font-mono tracking-widest"
                    {...codeForm.register("access_code")}
                  />
                </div>
                {codeForm.formState.errors.access_code && (
                  <p className="text-sm text-destructive">
                    {codeForm.formState.errors.access_code.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full h-10" disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                {loading ? "Ingresando..." : "Ingresar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        No tenes cuenta?{" "}
        <Link
          href="/register"
          className="font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
        >
          Registrate
        </Link>
      </p>
    </div>
  );
}
