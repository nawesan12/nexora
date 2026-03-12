import type { Permission } from "@nexora/shared/constants";

export function hasPermission(
  permissions: string[],
  permission: Permission
): boolean {
  return permissions.includes(permission);
}

export function hasAnyPermission(
  permissions: string[],
  required: Permission[]
): boolean {
  return required.some((p) => permissions.includes(p));
}

export type { Permission };
