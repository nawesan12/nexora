import { api } from "./api-client";
import type { BankDashboardData, FinancialIndices } from "@pronto/shared/types";

export const bankAccountsApi = {
  getDashboard: () =>
    api.get<BankDashboardData>("/api/v1/finanzas/cuentas-bancarias"),
  getIndices: () =>
    api.get<FinancialIndices>("/api/v1/finanzas/indices"),
};
