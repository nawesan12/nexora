"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  loginSchema,
  accessCodeSchema,
  type LoginInput,
  type AccessCodeInput,
} from "@pronto/shared/schemas";
import { ROLE_DEFAULT_REDIRECT } from "@pronto/shared/constants";
import { authApi } from "@/lib/auth";
import { useUserStore } from "@/store/user-store";
import { ApiClientError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Lock, KeyRound, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { GoogleLoginButton } from "@/components/auth/google-login-button";
import { DemoLoginButton } from "@/components/auth/demo-login-button";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_state: "Error de seguridad en la autenticacion. Intenta de nuevo.",
  exchange_failed: "No se pudo completar la autenticacion con Google.",
  userinfo_failed: "No se pudo obtener la informacion de tu cuenta de Google.",
  decode_failed: "Error al procesar los datos de Google.",
  auth_failed: "Error al iniciar sesion con Google.",
  access_denied: "Acceso denegado por Google.",
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  // Handle OAuth error query params
  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      const message =
        OAUTH_ERROR_MESSAGES[error] ||
        "Error al iniciar sesion. Intenta de nuevo.";
      toast.error(message);
      // Clean up the URL
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, router]);

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

  function handleDemoSuccess(email: string, password: string) {
    emailForm.setValue("email", email);
    emailForm.setValue("password", password);
    emailForm.handleSubmit(onEmailLogin)();
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

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border/60" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              o continuar con
            </span>
          </div>
        </div>

        {/* Social / Demo login */}
        <div className="space-y-3">
          <GoogleLoginButton />
          <DemoLoginButton onSuccess={handleDemoSuccess} />
        </div>
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
