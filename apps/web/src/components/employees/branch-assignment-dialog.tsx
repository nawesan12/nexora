"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/user-store";
import {
  useEmpleadoBranches,
  useAssignEmpleadoBranches,
} from "@/hooks/queries/use-employees";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BranchAssignmentDialogProps {
  empleadoId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BranchAssignmentDialog({
  empleadoId,
  open,
  onOpenChange,
}: BranchAssignmentDialogProps) {
  const user = useUserStore((s) => s.user);
  const allBranches = user?.sucursales || [];
  const { data: assignedBranches } = useEmpleadoBranches(empleadoId);
  const assignMutation = useAssignEmpleadoBranches();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (assignedBranches) {
      setSelected(new Set(assignedBranches.map((b) => b.id)));
    }
  }, [assignedBranches]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSave = () => {
    assignMutation.mutate(
      { id: empleadoId, branchIds: Array.from(selected) },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Asignar Sucursales</DialogTitle>
          <DialogDescription>
            Selecciona las sucursales a las que tiene acceso este empleado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-4">
          {allBranches.map((branch) => {
            const isSelected = selected.has(branch.id);
            return (
              <button
                key={branch.id}
                type="button"
                onClick={() => toggle(branch.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border p-3.5 text-left transition-all duration-150",
                  isSelected
                    ? "border-[var(--accent)]/40 bg-[var(--accent)]/5"
                    : "border-border/50 hover:bg-muted/30",
                )}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isSelected
                      ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                      : "bg-muted/50 text-muted-foreground",
                  )}
                >
                  {isSelected ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Building2 className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {branch.nombre}
                  </p>
                  {branch.direccion && (
                    <p className="text-xs text-muted-foreground truncate">
                      {branch.direccion}
                    </p>
                  )}
                </div>
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggle(branch.id)}
                  className="shrink-0"
                  onClick={(e) => e.stopPropagation()}
                />
              </button>
            );
          })}
          {allBranches.length === 0 && (
            <div className="flex flex-col items-center py-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 mb-3">
                <Building2 className="h-6 w-6 text-muted-foreground/60" />
              </div>
              <p className="text-sm text-muted-foreground">
                No hay sucursales disponibles.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={assignMutation.isPending}>
            {assignMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
