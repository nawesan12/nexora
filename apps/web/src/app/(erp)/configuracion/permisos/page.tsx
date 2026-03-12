"use client";

import { useState, useCallback, useMemo } from "react";
import {
  PERMISSION_MODULES,
  DEFAULT_ROLE_PERMISSIONS,
  ROLE_LABELS,
  ROLES,
  type Rol,
  type Permission,
} from "@nexora/shared/constants";
import {
  useRolesPermissions,
  useUpdateRolePermissions,
  useResetRolePermissions,
} from "@/hooks/queries/use-permissions";
import { useUserStore } from "@/store/user-store";
import { hasPermission } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, RotateCcw, Shield, ShieldCheck } from "lucide-react";

const EDITABLE_ROLES = ROLES.filter((r) => r !== "ADMIN") as Rol[];

export default function PermisosPage() {
  const user = useUserStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const canManage = hasPermission(permissions, "settings:manage");

  const { data: rolesData, isLoading } = useRolesPermissions();
  const updateMutation = useUpdateRolePermissions();
  const resetMutation = useResetRolePermissions();

  const [resetRole, setResetRole] = useState<Rol | null>(null);

  // Build a map of role → Set<permission> from API data, falling back to defaults
  const rolePermMap = useMemo(() => {
    const map: Record<string, Set<string>> = {};
    for (const role of EDITABLE_ROLES) {
      const apiEntry = rolesData?.find((r) => r.rol === role);
      if (apiEntry) {
        map[role] = new Set(apiEntry.permissions);
      } else {
        map[role] = new Set(DEFAULT_ROLE_PERMISSIONS[role]);
      }
    }
    return map;
  }, [rolesData]);

  // Track if a role has overrides (differs from defaults)
  const hasOverrides = useCallback(
    (role: Rol): boolean => {
      const apiEntry = rolesData?.find((r) => r.rol === role);
      return apiEntry ? !apiEntry.is_default : false;
    },
    [rolesData],
  );

  const isDefault = useCallback(
    (role: Rol, perm: Permission): boolean => {
      return (DEFAULT_ROLE_PERMISSIONS[role] || []).includes(perm);
    },
    [],
  );

  const handleToggle = useCallback(
    (role: Rol, perm: Permission, checked: boolean) => {
      const current = new Set(rolePermMap[role]);
      if (checked) {
        current.add(perm);
      } else {
        current.delete(perm);
      }
      updateMutation.mutate({ rol: role, permissions: [...current] });
    },
    [rolePermMap, updateMutation],
  );

  const handleReset = useCallback(() => {
    if (resetRole) {
      resetMutation.mutate(resetRole);
      setResetRole(null);
    }
  }, [resetRole, resetMutation]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Cargando permisos...
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Permisos</h1>
          <p className="text-sm text-muted-foreground">
            Configura los permisos de cada rol. ADMIN siempre tiene acceso
            total.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 text-xs">
            <ShieldCheck className="h-3 w-3" />
            {EDITABLE_ROLES.length} roles
          </Badge>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-primary" />
          Habilitado por defecto
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          Modificado
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          Deshabilitado
        </div>
      </div>

      {/* Permission matrix */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-primary to-violet-500" />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground min-w-[200px]">
                    Permiso
                  </th>
                  {EDITABLE_ROLES.map((role) => (
                    <th
                      key={role}
                      className="px-3 py-3 text-center min-w-[100px]"
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground">
                          {ROLE_LABELS[role]}
                        </span>
                        {canManage && hasOverrides(role) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setResetRole(role)}
                                className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] text-amber-600 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950/50 transition-colors"
                              >
                                <RotateCcw className="h-2.5 w-2.5" />
                                Reset
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Restablecer permisos por defecto
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MODULES.map((module) => (
                  <>
                    {/* Module header row */}
                    <tr key={module.label} className="bg-muted/30">
                      <td
                        colSpan={EDITABLE_ROLES.length + 1}
                        className="sticky left-0 z-10 px-4 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {module.label}
                          </span>
                        </div>
                      </td>
                    </tr>
                    {/* Permission rows */}
                    {module.permissions.map((perm) => (
                      <tr
                        key={perm.value}
                        className="border-b border-border/30 hover:bg-muted/20 transition-colors"
                      >
                        <td className="sticky left-0 z-10 bg-card px-4 py-2.5">
                          <span className="text-sm text-foreground">
                            {perm.label}
                          </span>
                          <span className="ml-2 text-[10px] font-mono text-muted-foreground/60">
                            {perm.value}
                          </span>
                        </td>
                        {EDITABLE_ROLES.map((role) => {
                          const enabled = rolePermMap[role]?.has(perm.value);
                          const defaultEnabled = isDefault(role, perm.value);
                          const isOverridden = enabled !== defaultEnabled;

                          return (
                            <td
                              key={role}
                              className="px-3 py-2.5 text-center"
                            >
                              <div className="flex flex-col items-center gap-1">
                                <Switch
                                  checked={!!enabled}
                                  onCheckedChange={(checked) =>
                                    handleToggle(role, perm.value, checked)
                                  }
                                  disabled={
                                    !canManage || updateMutation.isPending
                                  }
                                  className="data-[state=checked]:bg-primary"
                                />
                                {isOverridden && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Reset confirmation */}
      <AlertDialog
        open={!!resetRole}
        onOpenChange={() => setResetRole(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restablecer permisos</AlertDialogTitle>
            <AlertDialogDescription>
              Se restablecerán todos los permisos del rol{" "}
              <span className="font-semibold">
                {resetRole ? ROLE_LABELS[resetRole] : ""}
              </span>{" "}
              a sus valores por defecto. Los cambios personalizados se
              perderán.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset}>
              Restablecer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
    </TooltipProvider>
  );
}
