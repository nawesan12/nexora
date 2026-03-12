"use client";

import { Building2 } from "lucide-react";
import { useUserStore } from "@/store/user-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export function BranchSelector() {
  const user = useUserStore((s) => s.user);

  if (!user || !user.sucursales || user.sucursales.length <= 1) {
    return null;
  }

  const currentBranch = user.sucursal_actual || user.sucursales[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">{currentBranch?.nombre}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {user.sucursales.map((branch) => (
          <DropdownMenuItem key={branch.id}>
            {branch.nombre}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
