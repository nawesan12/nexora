"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "@/lib/auth";
import { useUserStore } from "@/store/user-store";
import { ROLE_DEFAULT_REDIRECT } from "@nexora/shared/constants";
import { ApiClientError } from "@/lib/api-client";
import type { Rol } from "@nexora/shared/constants";

export function useCurrentUser() {
  const setUser = useUserStore((s) => s.setUser);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const user = await authApi.getMe();
      setUser(user);
      return user;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogin() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user) => {
      setUser(user);
      queryClient.setQueryData(["auth", "me"], user);
      toast.success("Sesión iniciada");
      const redirect =
        ROLE_DEFAULT_REDIRECT[user.rol as Rol] || "/dashboard";
      router.push(redirect);
    },
    onError: (err) => {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Error al iniciar sesión";
      toast.error(message);
    },
  });
}

export function useLogout() {
  const router = useRouter();
  const clearUser = useUserStore((s) => s.clearUser);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      clearUser();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
