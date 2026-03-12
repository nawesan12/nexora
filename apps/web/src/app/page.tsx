"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user-store";
import { ROLE_DEFAULT_REDIRECT } from "@nexora/shared/constants";

export default function Home() {
  const router = useRouter();
  const { user, isHydrated } = useUserStore();

  useEffect(() => {
    if (!isHydrated) return;

    if (user) {
      const redirect =
        ROLE_DEFAULT_REDIRECT[
          user.rol as keyof typeof ROLE_DEFAULT_REDIRECT
        ] || "/dashboard";
      router.replace(redirect);
    } else {
      router.replace("/login");
    }
  }, [isHydrated, user, router]);

  return null;
}
