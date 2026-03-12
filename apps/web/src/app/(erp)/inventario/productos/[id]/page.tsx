"use client";

import { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useProducto, useUpdateProducto } from "@/hooks/queries/use-products";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Pencil } from "lucide-react";
import gsap from "gsap";

export default function EditProductoPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: producto, isLoading } = useProducto(id);
  const updateMutation = useUpdateProducto();

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current || isLoading) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".edit-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      );

      gsap.fromTo(
        ".edit-card",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: "power2.out", delay: 0.2 },
      );
    }, containerRef);

    return () => ctx.revert();
  }, [isLoading, producto]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="space-y-3">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        </div>
        <Skeleton className="h-[420px] w-full rounded-lg" />
      </div>
    );
  }

  if (!producto) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <Link
          href="/inventario/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <div className="flex flex-col items-center gap-2 py-20">
          <p className="font-medium text-foreground">
            Producto no encontrado
          </p>
          <p className="text-sm text-muted-foreground">
            El producto que buscas no existe o fue eliminado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="mx-auto max-w-2xl space-y-5">
      {/* Header */}
      <div className="edit-header space-y-3">
        <Link
          href="/inventario/productos"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
            <Pencil className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Editar Producto
            </h1>
            <p className="text-sm text-muted-foreground">{producto.nombre}</p>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <Card className="edit-card border-0 shadow-sm">
        <CardContent className="pt-6">
          <ProductForm
            defaultValues={producto}
            onSubmit={(data) => {
              updateMutation.mutate(
                { id, data },
                { onSuccess: () => router.push("/inventario/productos") },
              );
            }}
            isPending={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
