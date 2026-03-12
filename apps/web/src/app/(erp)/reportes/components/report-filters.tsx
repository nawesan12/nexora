"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";

interface ReportFiltersProps {
  desde: string;
  hasta: string;
  onDesdeChange: (v: string) => void;
  onHastaChange: (v: string) => void;
  exportUrl?: string;
}

export function ReportFilters({ desde, hasta, onDesdeChange, onHastaChange, exportUrl }: ReportFiltersProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Desde</Label>
        <Input type="date" value={desde} onChange={(e) => onDesdeChange(e.target.value)} className="h-9 w-40" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Hasta</Label>
        <Input type="date" value={hasta} onChange={(e) => onHastaChange(e.target.value)} className="h-9 w-40" />
      </div>
      {exportUrl && (
        <Button variant="outline" size="sm" className="h-9" asChild>
          <a href={`${API_URL}${exportUrl}`} target="_blank" rel="noopener noreferrer">
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Exportar CSV
          </a>
        </Button>
      )}
    </div>
  );
}
