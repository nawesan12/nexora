"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreatePedido } from "@/hooks/queries/use-orders";
import { OrderForm } from "@/components/orders/order-form";
import type { PedidoInput } from "@nexora/shared/schemas";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import gsap from "gsap";

export default function NuevoPedidoPage() {
  const router = useRouter();
  const createMutation = useCreatePedido();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (data: PedidoInput) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        router.push(`/ventas/pedidos/${result.id}`);
      },
    });
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nuevo-pedido-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".nuevo-pedido-form",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="nuevo-pedido-header space-y-4">
        <Link
          href="/ventas/pedidos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Pedidos
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ShoppingCart className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nuevo Pedido</h1>
            <p className="text-muted-foreground mt-0.5">
              Crea un nuevo pedido de venta
            </p>
          </div>
        </div>
      </div>
      <div className="nuevo-pedido-form">
        <OrderForm onSubmit={handleSubmit} isLoading={createMutation.isPending} />
      </div>
    </div>
  );
}
