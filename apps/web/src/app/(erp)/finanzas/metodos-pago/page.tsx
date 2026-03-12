"use client";

import { useState } from "react";
import {
  useMetodosPago,
  useCreateMetodoPago,
  useUpdateMetodoPago,
  useDeleteMetodoPago,
} from "@/hooks/queries/use-finance";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, CreditCard } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyFinance } from "@/components/illustrations";

export default function MetodosPagoPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMetodosPago({ page, pageSize: 20 });
  const createMutation = useCreateMetodoPago();
  const updateMutation = useUpdateMetodoPago();
  const deleteMutation = useDeleteMetodoPago();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editNombre, setEditNombre] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newNombre, setNewNombre] = useState("");

  const metodos = data?.data || [];
  const meta = data?.meta;

  const handleCreate = () => {
    if (!newNombre.trim()) return;
    createMutation.mutate(
      { nombre: newNombre, activo: true } as any,
      {
        onSuccess: () => {
          setShowCreate(false);
          setNewNombre("");
        },
      },
    );
  };

  const handleUpdate = () => {
    if (!editId || !editNombre.trim()) return;
    updateMutation.mutate(
      { id: editId, data: { nombre: editNombre, activo: true } as any },
      {
        onSuccess: () => {
          setEditId(null);
          setEditNombre("");
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Métodos de Pago
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona los métodos de pago disponibles
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Método
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showCreate && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newNombre}
                      onChange={(e) => setNewNombre(e.target.value)}
                      placeholder="Nombre del método"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                        if (e.key === "Escape") setShowCreate(false);
                      }}
                    />
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={handleCreate}
                        disabled={createMutation.isPending}
                      >
                        <Check className="h-4 w-4 text-emerald-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setShowCreate(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                      Cargando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : metodos.length === 0 && !showCreate ? (
                <TableRow>
                  <TableCell colSpan={3}>
                    <EmptyState
                      illustration={<EmptyFinance className="w-full h-full" />}
                      title="No hay métodos de pago"
                      size="sm"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                metodos.map((m: any) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      {editId === m.id ? (
                        <Input
                          value={editNombre}
                          onChange={(e) => setEditNombre(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate();
                            if (e.key === "Escape") setEditId(null);
                          }}
                        />
                      ) : (
                        <span className="font-medium">{m.nombre}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs font-medium ${
                          m.activo
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
                        }`}
                      >
                        {m.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editId === m.id ? (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={handleUpdate}
                          >
                            <Check className="h-4 w-4 text-emerald-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setEditId(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-[var(--accent)]/10 hover:text-[var(--accent)]"
                            onClick={() => {
                              setEditId(m.id);
                              setEditNombre(m.nombre);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteId(m.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {meta && meta.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Página <span className="font-medium text-foreground">{meta.page}</span> de{" "}
                <span className="font-medium text-foreground">{meta.totalPages}</span>
              </p>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-8" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft className="mr-1 h-3.5 w-3.5" />Anterior
                </Button>
                <Button variant="outline" size="sm" className="h-8" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                  Siguiente<ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar método de pago</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) {
                  deleteMutation.mutate(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
