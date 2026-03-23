"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_LABELS } from "@pronto/shared/constants";
import { getAvailableTransitions } from "@pronto/shared/constants";
import type { Rol } from "@pronto/shared/constants";
import { useTransitionPedido } from "@/hooks/queries/use-orders";

interface Props {
  pedidoId: string;
  currentState: string;
  role: Rol;
}

export function OrderTransitionActions({ pedidoId, currentState, role }: Props) {
  const transitions = getAvailableTransitions(currentState, role);
  const transitionMutation = useTransitionPedido();
  const [dialogState, setDialogState] = useState<string | null>(null);
  const [comentario, setComentario] = useState("");

  if (transitions.length === 0) return null;

  const handleTransition = () => {
    if (!dialogState) return;
    transitionMutation.mutate(
      { id: pedidoId, data: { estado: dialogState, comentario } },
      {
        onSuccess: () => {
          setDialogState(null);
          setComentario("");
        },
      },
    );
  };

  const getButtonVariant = (state: string) => {
    if (state === "CANCELADO" || state === "RECHAZADO") return "destructive" as const;
    if (state === "APROBADO" || state === "ENTREGADO") return "default" as const;
    return "outline" as const;
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {transitions.map((state) => (
          <Button
            key={state}
            variant={getButtonVariant(state)}
            size="sm"
            onClick={() => setDialogState(state)}
          >
            {ORDER_STATUS_LABELS[state as keyof typeof ORDER_STATUS_LABELS] || state}
          </Button>
        ))}
      </div>

      <Dialog open={!!dialogState} onOpenChange={() => setDialogState(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar estado</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Cambiar a:{" "}
            <strong>
              {dialogState &&
                (ORDER_STATUS_LABELS[dialogState as keyof typeof ORDER_STATUS_LABELS] || dialogState)}
            </strong>
          </p>
          <Textarea
            placeholder="Comentario (opcional)"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogState(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleTransition}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending ? "Cambiando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
