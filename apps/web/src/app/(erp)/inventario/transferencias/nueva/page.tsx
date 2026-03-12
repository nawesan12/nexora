"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { transferenciaSchema, type TransferenciaInput } from "@nexora/shared/schemas";
import { useCreateTransferencia } from "@/hooks/queries/use-transfers";
import { useProductos } from "@/hooks/queries/use-products";
import { useUserStore } from "@/store/user-store";
import { useDebounce } from "@/hooks/use-debounce";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, ArrowLeftRight, Plus, Search, Trash2 } from "lucide-react";
import gsap from "gsap";

export default function NuevaTransferenciaPage() {
  const router = useRouter();
  const createMutation = useCreateTransferencia();
  const user = useUserStore((s) => s.user);
  const sucursales = user?.sucursales || [];

  const [searchInput, setSearchInput] = useState("");
  const search = useDebounce(searchInput, 300);
  const { data: productosData } = useProductos({
    pageSize: 20,
    search: search || undefined,
  });
  const productosDisponibles = productosData?.data || [];

  const form = useForm<TransferenciaInput>({
    resolver: zodResolver(transferenciaSchema),
    defaultValues: {
      sucursal_origen_id: "",
      sucursal_destino_id: "",
      observaciones: "",
      items: [],
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const items = watch("items");
  const sucursalOrigenId = watch("sucursal_origen_id");
  const sucursalDestinoId = watch("sucursal_destino_id");

  const addProduct = (producto: {
    id: string;
    nombre: string;
    codigo?: string;
  }) => {
    if (items.some((item) => item.producto_id === producto.id)) return;
    setValue("items", [
      ...items,
      {
        producto_id: producto.id,
        producto_nombre: producto.nombre,
        producto_codigo: producto.codigo || "",
        cantidad_solicitada: 1,
      },
    ]);
    setSearchInput("");
  };

  const removeProduct = (index: number) => {
    setValue(
      "items",
      items.filter((_, i) => i !== index)
    );
  };

  const updateCantidad = (index: number, cantidad: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], cantidad_solicitada: cantidad };
    setValue("items", newItems);
  };

  const onSubmit = (data: TransferenciaInput) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        router.push("/inventario/transferencias");
      },
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".nueva-transferencia-header",
        { opacity: 0, y: -20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
      gsap.fromTo(
        ".nueva-transferencia-form",
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, delay: 0.15, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const sameOriginDestino =
    sucursalOrigenId &&
    sucursalDestinoId &&
    sucursalOrigenId === sucursalDestinoId;

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Header */}
      <div className="nueva-transferencia-header space-y-4">
        <Link
          href="/inventario/transferencias"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Transferencias
        </Link>
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <ArrowLeftRight className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Nueva Transferencia
            </h1>
            <p className="text-muted-foreground mt-0.5">
              Solicita el traslado de productos entre sucursales
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="nueva-transferencia-form space-y-6"
      >
        {/* Sucursales */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Sucursales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <Label>Sucursal de Origen</Label>
                <Select
                  value={sucursalOrigenId}
                  onValueChange={(v) => setValue("sucursal_origen_id", v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Seleccionar origen" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sucursal_origen_id && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.sucursal_origen_id.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Sucursal de Destino</Label>
                <Select
                  value={sucursalDestinoId}
                  onValueChange={(v) => setValue("sucursal_destino_id", v)}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue placeholder="Seleccionar destino" />
                  </SelectTrigger>
                  <SelectContent>
                    {sucursales.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.sucursal_destino_id && (
                  <p className="text-xs text-destructive mt-1">
                    {errors.sucursal_destino_id.message}
                  </p>
                )}
              </div>
            </div>
            {sameOriginDestino && (
              <p className="text-xs text-destructive mt-3">
                La sucursal de origen y destino no pueden ser la misma
              </p>
            )}
          </CardContent>
        </Card>

        {/* Products */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Productos ({items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto por nombre o codigo..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Search results */}
            {searchInput && productosDisponibles.length > 0 && (
              <Card className="border shadow-sm">
                <CardContent className="py-2 px-0">
                  <div className="max-h-48 overflow-y-auto">
                    {productosDisponibles.map((p) => {
                      const alreadyAdded = items.some(
                        (item) => item.producto_id === p.id
                      );
                      return (
                        <button
                          key={p.id}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() =>
                            addProduct({
                              id: p.id,
                              nombre: p.nombre,
                              codigo: p.codigo,
                            })
                          }
                          className="w-full px-4 py-2 text-left text-sm hover:bg-muted/50 flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <div>
                            <span className="font-medium">{p.nombre}</span>
                            {p.codigo && (
                              <span className="ml-2 text-xs text-muted-foreground">
                                {p.codigo}
                              </span>
                            )}
                          </div>
                          {alreadyAdded ? (
                            <span className="text-xs text-muted-foreground">
                              Ya agregado
                            </span>
                          ) : (
                            <Plus className="h-4 w-4 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Line items table */}
            {items.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="border-muted/50">
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Producto
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Codigo
                    </TableHead>
                    <TableHead className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground w-32">
                      Cantidad
                    </TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.producto_id} className="border-muted/30">
                      <TableCell className="font-medium">
                        {item.producto_nombre}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.producto_codigo || "\u2014"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min={1}
                          value={item.cantidad_solicitada}
                          onChange={(e) =>
                            updateCantidad(index, parseInt(e.target.value) || 1)
                          }
                          className="w-24 ml-auto text-right tabular-nums"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeProduct(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {items.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Busca y agrega productos a la transferencia
              </div>
            )}

            {errors.items && (
              <p className="text-xs text-destructive">
                {errors.items.message || errors.items.root?.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Observaciones */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold">
              Observaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Observaciones opcionales..."
              {...register("observaciones")}
              rows={3}
            />
            {errors.observaciones && (
              <p className="text-xs text-destructive mt-1">
                {errors.observaciones.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" asChild>
            <Link href="/inventario/transferencias">Cancelar</Link>
          </Button>
          <Button
            type="submit"
            disabled={
              createMutation.isPending ||
              items.length === 0 ||
              !!sameOriginDestino
            }
          >
            {createMutation.isPending
              ? "Creando..."
              : "Crear Transferencia"}
          </Button>
        </div>
      </form>
    </div>
  );
}
