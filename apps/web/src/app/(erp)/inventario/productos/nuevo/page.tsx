"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCreateProducto } from "@/hooks/queries/use-products";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, PackagePlus } from "lucide-react";
import gsap from "gsap";

export default function NuevoProductoPage() {
  const router = useRouter();
  const createMutation = useCreateProducto();

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nuevo-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".nuevo-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.2 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="nuevo-header space-y-3">
        <Link
          href="/inventario/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <PackagePlus className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Nuevo Producto
            </h1>
            <p className="text-sm text-muted-foreground">
              Completa los datos para crear un nuevo producto
            </p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="nuevo-card border-0 shadow-sm">
        <CardContent className="pt-6">
          <ProductForm
            onSubmit={(data) => {
              createMutation.mutate(data, {
                onSuccess: () => router.push("/inventario/productos"),
              });
            }}
            isPending={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
