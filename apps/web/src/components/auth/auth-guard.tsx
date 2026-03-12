"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { authApi } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isHydrated, setUser, clearUser } = useUserStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;

    if (user) {
      setChecking(false);
      return;
    }

    authApi
      .getMe()
      .then((me) => {
        setUser(me);
        setChecking(false);
      })
      .catch(() => {
        clearUser();
        router.replace("/login");
      });
  }, [isHydrated, user, setUser, clearUser, router]);

  if (!isHydrated || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-4 px-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}
