"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  clienteSchema,
  condicionIvaValues,
  reputacionValues,
} from "@nexora/shared/schemas";
import type { ClienteInput } from "@nexora/shared/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const condicionIvaLabels: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTO: "Monotributo",
  EXENTO: "Exento",
  NO_RESPONSABLE: "No Responsable",
  CONSUMIDOR_FINAL: "Consumidor Final",
};

const reputacionLabels: Record<string, string> = {
  DEUDOR: "Deudor",
  BUENA: "Buena",
  CRITICA: "Critica",
  EXCELENTE: "Excelente",
  NORMAL: "Normal",
};

interface ClientFormProps {
  defaultValues?: Partial<ClienteInput>;
  onSubmit: (data: ClienteInput) => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export function ClientForm({
  defaultValues,
  onSubmit,
  isLoading,
  submitLabel = "Guardar",
}: ClientFormProps) {
  const form = useForm<ClienteInput>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: "",
      apellido: "",
      razon_social: "",
      cuit: "",
      condicion_iva: "CONSUMIDOR_FINAL",
      email: "",
      telefono: "",
      reputacion: "NORMAL",
      ...defaultValues,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section: Identificacion */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Identificacion</h3>
            <p className="text-xs text-muted-foreground">Datos principales del cliente</p>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Apellido" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="razon_social"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Razon Social</FormLabel>
                  <FormControl>
                    <Input placeholder="Razon Social" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cuit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CUIT</FormLabel>
                  <FormControl>
                    <Input placeholder="XX-XXXXXXXX-X" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Section: Fiscal */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Fiscal</h3>
            <p className="text-xs text-muted-foreground">Condicion impositiva y reputacion</p>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="condicion_iva"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condicion IVA</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar condicion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {condicionIvaValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {condicionIvaLabels[val]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reputacion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reputacion</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar reputacion" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {reputacionValues.map((val) => (
                        <SelectItem key={val} value={val}>
                          {reputacionLabels[val]}
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

        {/* Section: Contacto */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Contacto</h3>
            <p className="text-xs text-muted-foreground">Informacion de contacto</p>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="email@ejemplo.com" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefono</FormLabel>
                  <FormControl>
                    <Input placeholder="Telefono" {...field} />
                  </FormControl>
                  <FormDescription>Opcional</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
