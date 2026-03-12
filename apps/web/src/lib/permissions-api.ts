import { api } from "./api-client";

export interface RolePermissions {
  rol: string;
  permissions: string[];
  is_default: boolean;
}

export const permissionsApi = {
  listAll: () => api.get<RolePermissions[]>("/api/v1/permisos"),
  getForRole: (rol: string) =>
    api.get<RolePermissions>(`/api/v1/permisos/${rol}`),
  updateForRole: (rol: string, permissions: string[]) =>
    api.put<RolePermissions>(`/api/v1/permisos/${rol}`, { permissions }),
  resetRole: (rol: string) =>
    api.del<void>(`/api/v1/permisos/${rol}`),
};
