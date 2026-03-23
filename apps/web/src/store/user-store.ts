"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserInfo } from "@pronto/shared/types";

interface UserState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  setUser: (user: UserInfo | null) => void;
  clearUser: () => void;
  setHydrated: (hydrated: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isHydrated: false,
      setUser: (user) =>
        set({ user, isAuthenticated: !!user }),
      clearUser: () =>
        set({ user: null, isAuthenticated: false }),
      setHydrated: (hydrated) => set({ isHydrated: hydrated }),
    }),
    {
      name: "pronto-user",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    },
  ),
);
