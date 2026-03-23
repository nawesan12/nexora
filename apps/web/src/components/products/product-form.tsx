"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productoSchema, type ProductoInput } from "@pronto/shared/schemas";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useFamilias } from "@/hooks/queries/use-products";
import { useCategoriasByFamilia } from "@/hooks/queries/use-products";
import { useState } from "react";
import type { Producto } from "@pronto/shared/types";
import { Loader2 } from "lucide-react";

const UNIDADES = [
  { value: "UNIDAD", label: "Unidad" },
  { value: "KG", label: "Kilogramo" },
  { value: "LITRO", label: "Litro" },
  { value: "METRO", label: "Metro" },
  { value: "CAJA", label: "Caja" },
  { value: "BOLSA", label: "Bolsa" },
  { value: "PACK", label: "Pack" },
];

interface ProductFormProps {
  defaultValues?: Producto;
  onSubmit: (data: ProductoInput) => void;
  isPending?: boolean;
}

export function ProductForm({
  defaultValues,
  onSubmit,
  isPending,
}: ProductFormProps) {
  const form = useForm<ProductoInput>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: defaultValues?.codigo || "",
      nombre: defaultValues?.nombre || "",
      descripcion: defaultValues?.descripcion || "",
      precio_base: defaultValues?.precio_base || 0,
      unidad: (defaultValues?.unidad as ProductoInput["unidad"]) || "UNIDAD",
      categoria_id: defaultValues?.categoria_id || "",
    },
  });

  const { data: familiasData } = useFamilias(1, 100);
  const familias = familiasData?.data || [];

  const [selectedFamiliaId, setSelectedFamiliaId] = useState<string>("");
  const { data: categorias } = useCategoriasByFamilia(selectedFamiliaId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Identificacion */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Identificacion
            </h3>
            <p className="text-xs text-muted-foreground">
              Datos principales del producto
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Codigo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="SKU-001"
                      className="font-mono"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del producto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="descripcion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripcion</FormLabel>
                <FormControl>
                  <Input placeholder="Breve descripcion del producto" {...field} />
                </FormControl>
                <FormDescription>Opcional</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Section: Clasificacion */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Clasificacion
            </h3>
            <p className="text-xs text-muted-foreground">
              Familia y categoria del producto
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Familia</label>
              <Select
                onValueChange={setSelectedFamiliaId}
                value={selectedFamiliaId}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue placeholder="Filtrar por familia" />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <FormField
              control={form.control}
              name="categoria_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {selectedFamiliaId && categorias ? (
                        categorias.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.nombre}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectGroup>
                          <SelectLabel>
                            Seleccione una familia primero
                          </SelectLabel>
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section: Comercial */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Comercial</h3>
            <p className="text-xs text-muted-foreground">
              Precio y unidad de medida
            </p>
          </div>
          <Separator />

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="precio_base"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio Base</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="unidad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {UNIDADES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full shadow-sm sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending
              ? "Guardando..."
              : defaultValues
                ? "Actualizar"
                : "Crear Producto"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
