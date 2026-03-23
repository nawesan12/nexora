"use client";

import { useState } from "react";
import { ROLE_LABELS, ESTADO_EMPLEADO_LABELS } from "@pronto/shared/constants";
import type { Empleado } from "@pronto/shared/types";
import { useUserStore } from "@/store/user-store";
import {
  useBulkUpdateEstado,
  useBulkUpdateRol,
  useBulkAssignBranches,
} from "@/hooks/queries/use-employees";
import { empleadosApi } from "@/lib/employees";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Download,
  ChevronDown,
  UserCog,
  Shield,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

interface EmployeeBulkActionsProps {
  selectedRows: Empleado[];
  onClearSelection: () => void;
}

export function EmployeeBulkActions({
  selectedRows,
  onClearSelection,
}: EmployeeBulkActionsProps) {
  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];

  const bulkEstado = useBulkUpdateEstado();
  const bulkRol = useBulkUpdateRol();
  const bulkBranches = useBulkAssignBranches();

  const [confirmAction, setConfirmAction] = useState<{
    type: "estado" | "rol" | "branches";
    label: string;
    value?: string;
  } | null>(null);

  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);

  const ids = selectedRows.map((r) => r.id);

  const handleConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "estado" && confirmAction.value) {
      bulkEstado.mutate(
        { ids, estado: confirmAction.value },
        {
          onSuccess: () => {
            onClearSelection();
            setConfirmAction(null);
          },
        },
      );
    } else if (confirmAction.type === "rol" && confirmAction.value) {
      bulkRol.mutate(
        { ids, rol: confirmAction.value },
        {
          onSuccess: () => {
            onClearSelection();
            setConfirmAction(null);
          },
        },
      );
    }
  };

  const handleBranchesConfirm = () => {
    if (selectedBranches.length === 0) {
      toast.error("Selecciona al menos una sucursal");
      return;
    }
    bulkBranches.mutate(
      { ids, branchIds: selectedBranches },
      {
        onSuccess: () => {
          onClearSelection();
          setBranchDialogOpen(false);
          setSelectedBranches([]);
        },
      },
    );
  };

  const handleExportCsv = async () => {
    try {
      const blob = await empleadosApi.exportCsv();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `empleados-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exportado");
    } catch {
      toast.error("Error al exportar CSV");
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Cambiar Estado */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <UserCog className="mr-1.5 h-3.5 w-3.5" />
            Cambiar Estado
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {Object.entries(ESTADO_EMPLEADO_LABELS).map(([value, label]) => (
            <DropdownMenuItem
              key={value}
              onClick={() =>
                setConfirmAction({
                  type: "estado",
                  label: `Cambiar estado a "${label}"`,
                  value,
                })
              }
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Cambiar Rol */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            <Shield className="mr-1.5 h-3.5 w-3.5" />
            Cambiar Rol
            <ChevronDown className="ml-1 h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <DropdownMenuItem
              key={value}
              onClick={() =>
                setConfirmAction({
                  type: "rol",
                  label: `Cambiar rol a "${label}"`,
                  value,
                })
              }
            >
              {label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Asignar Sucursales */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={() => setBranchDialogOpen(true)}
      >
        <Building2 className="mr-1.5 h-3.5 w-3.5" />
        Asignar Sucursales
      </Button>

      {/* Exportar CSV */}
      <Button
        variant="ghost"
        size="sm"
        className="h-7 text-xs"
        onClick={handleExportCsv}
      >
        <Download className="mr-1.5 h-3.5 w-3.5" />
        Exportar CSV
      </Button>

      {/* Confirm Estado/Rol Dialog */}
      <AlertDialog
        open={!!confirmAction}
        onOpenChange={() => setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar accion</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.label} para {selectedRows.length} empleado
              {selectedRows.length > 1 ? "s" : ""}. Esta accion se aplicara a
              todos los seleccionados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={bulkEstado.isPending || bulkRol.isPending}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Branch Assignment Dialog */}
      <AlertDialog
        open={branchDialogOpen}
        onOpenChange={setBranchDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Asignar Sucursales</AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona las sucursales para asignar a {selectedRows.length}{" "}
              empleado{selectedRows.length > 1 ? "s" : ""}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 py-4">
            {sucursales.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <Checkbox
                  id={`branch-${s.id}`}
                  checked={selectedBranches.includes(s.id)}
                  onCheckedChange={(checked) => {
                    setSelectedBranches((prev) =>
                      checked
                        ? [...prev, s.id]
                        : prev.filter((id) => id !== s.id),
                    );
                  }}
                />
                <label
                  htmlFor={`branch-${s.id}`}
                  className="text-sm font-medium text-foreground cursor-pointer"
                >
                  {s.nombre}
                </label>
              </div>
            ))}
            {sucursales.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay sucursales disponibles.
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setSelectedBranches([])}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBranchesConfirm}
              disabled={bulkBranches.isPending}
            >
              Asignar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
