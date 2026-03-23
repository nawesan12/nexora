"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Check, PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  width?: number;
  height?: number;
  className?: string;
  title?: string;
}

export function SignatureCapture({ onSave, width = 400, height = 200, className, title = "Firma" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePad | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    // Set actual canvas size for retina
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d")?.scale(ratio, ratio);

    const pad = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      minWidth: 1,
      maxWidth: 2.5,
    });

    pad.addEventListener("endStroke", () => {
      setIsEmpty(pad.isEmpty());
    });

    padRef.current = pad;

    return () => {
      pad.off();
    };
  }, []);

  const handleClear = useCallback(() => {
    padRef.current?.clear();
    setIsEmpty(true);
  }, []);

  const handleSave = useCallback(() => {
    if (!padRef.current || padRef.current.isEmpty()) return;
    const dataUrl = padRef.current.toDataURL("image/png");
    onSave(dataUrl);
  }, [onSave]);

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold">
            <PenTool className="h-4 w-4 text-[var(--accent)]" />
            {title}
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={handleClear} className="h-7 px-2 text-xs">
              <Eraser className="mr-1 h-3 w-3" />
              Limpiar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isEmpty} className="h-7 px-2 text-xs">
              <Check className="mr-1 h-3 w-3" />
              Confirmar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border-2 border-dashed border-border bg-white">
          <canvas
            ref={canvasRef}
            style={{ width: `${width}px`, height: `${height}px`, touchAction: "none" }}
            className="w-full cursor-crosshair"
          />
        </div>
        <p className="mt-1 text-center text-xs text-muted-foreground">
          Firme con el mouse o el dedo en dispositivos tactiles
        </p>
      </CardContent>
    </Card>
  );
}
