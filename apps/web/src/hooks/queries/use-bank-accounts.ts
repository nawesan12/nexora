"use client";

import { useQuery } from "@tanstack/react-query";
import { bankAccountsApi } from "@/lib/bank-accounts";

export function useBankDashboard() {
  return useQuery({
    queryKey: ["bank-dashboard"],
    queryFn: () => bankAccountsApi.getDashboard(),
  });
}

export function useFinancialIndices() {
  return useQuery({
    queryKey: ["financial-indices"],
    queryFn: () => bankAccountsApi.getIndices(),
  });
}
