"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Truck, Weight, Box } from "lucide-react";
import { cn } from "@/lib/utils";

interface VehicleVisualizerProps {
  marca: string;
  modelo: string;
  patente: string;
  capacidadKg?: number;
  capacidadVolumen?: number; // in m3
  className?: string;
}

export function VehicleVisualizer({
  marca,
  modelo,
  patente,
  capacidadKg,
  capacidadVolumen,
  className,
}: VehicleVisualizerProps) {
  // Calculate visual proportions based on volume
  const baseWidth = 280;
  const baseHeight = 120;
  // Scale cargo area based on volume (default 10m3)
  const vol = capacidadVolumen || 10;
  const cargoScale = Math.min(Math.max(vol / 20, 0.5), 1.5);
  const cargoWidth = 160 * cargoScale;
  const cargoHeight = 80 * cargoScale;

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Truck className="h-4 w-4 text-[var(--accent)]" />
          {marca} {modelo}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* SVG Vehicle Top-Down View */}
        <div className="flex justify-center">
          <svg
            width={baseWidth}
            height={baseHeight + 40}
            viewBox={`0 0 ${baseWidth} ${baseHeight + 40}`}
          >
            {/* Cab */}
            <rect
              x="10"
              y="20"
              width="60"
              height={baseHeight - 20}
              rx="8"
              fill="var(--accent)"
              opacity="0.2"
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            <text
              x="40"
              y={baseHeight / 2 + 10}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
            >
              Cabina
            </text>

            {/* Cargo Area */}
            <rect
              x="75"
              y={(baseHeight - cargoHeight) / 2 + 10}
              width={cargoWidth}
              height={cargoHeight}
              rx="4"
              fill="var(--chart-1)"
              opacity="0.15"
              stroke="var(--chart-1)"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            <text
              x={75 + cargoWidth / 2}
              y={baseHeight / 2 + 10}
              textAnchor="middle"
              className="fill-foreground text-[10px] font-medium"
            >
              Carga
            </text>
            {capacidadVolumen && (
              <text
                x={75 + cargoWidth / 2}
                y={baseHeight / 2 + 24}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {capacidadVolumen} m3
              </text>
            )}

            {/* Wheels */}
            <circle
              cx="30"
              cy={baseHeight + 5}
              r="8"
              fill="var(--muted-foreground)"
              opacity="0.4"
            />
            <circle
              cx="60"
              cy={baseHeight + 5}
              r="8"
              fill="var(--muted-foreground)"
              opacity="0.4"
            />
            <circle
              cx={75 + cargoWidth - 20}
              cy={baseHeight + 5}
              r="8"
              fill="var(--muted-foreground)"
              opacity="0.4"
            />
            <circle
              cx={75 + cargoWidth}
              cy={baseHeight + 5}
              r="8"
              fill="var(--muted-foreground)"
              opacity="0.4"
            />

            {/* Plate */}
            <rect
              x={baseWidth - 70}
              y="5"
              width="60"
              height="16"
              rx="3"
              fill="var(--background)"
              stroke="var(--border)"
              strokeWidth="1"
            />
            <text
              x={baseWidth - 40}
              y="16"
              textAnchor="middle"
              className="fill-foreground text-[9px] font-mono font-bold"
            >
              {patente}
            </text>
          </svg>
        </div>

        {/* Specs */}
        <div className="mt-3 flex items-center justify-center gap-4">
          {capacidadKg && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Weight className="h-3 w-3" />
              {capacidadKg.toLocaleString()} kg
            </Badge>
          )}
          {capacidadVolumen && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Box className="h-3 w-3" />
              {capacidadVolumen} m3
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
