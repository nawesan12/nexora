"use client";

import { useQuery } from "@tanstack/react-query";
import { salesKpisApi } from "@/lib/sales-kpis";

export function useSalesKPIs() {
  return useQuery({
    queryKey: ["sales-kpis"],
    queryFn: () => salesKpisApi.get(),
  });
}
