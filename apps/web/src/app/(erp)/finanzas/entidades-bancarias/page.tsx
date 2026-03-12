"use client";

import { useState } from "react";
import {
  useEntidadesBancarias,
  useCreateEntidadBancaria,
  useUpdateEntidadBancaria,
  useDeleteEntidadBancaria,
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
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Pencil, Trash2, Check, X, ChevronLeft, ChevronRight, Landmark } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EmptyFinance } from "@/components/illustrations";

export default function EntidadesBancariasPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useEntidadesBancarias({ page, pageSize: 20 });
  const createMutation = useCreateEntidadBancaria();
  const updateMutation = useUpdateEntidadBancaria();
  const deleteMutation = useDeleteEntidadBancaria();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nombre: "", codigo: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [newForm, setNewForm] = useState({ nombre: "", codigo: "" });

  const entidades = data?.data || [];
  const meta = data?.meta;

  const handleCreate = () => {
    if (!newForm.nombre.trim()) return;
    createMutation.mutate(newForm as any, {
      onSuccess: () => {
        setShowCreate(false);
        setNewForm({ nombre: "", codigo: "" });
      },
    });
  };

  const handleUpdate = () => {
    if (!editId || !editForm.nombre.trim()) return;
    updateMutation.mutate(
      { id: editId, data: editForm as any },
      {
        onSuccess: () => {
          setEditId(null);
          setEditForm({ nombre: "", codigo: "" });
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Entidades Bancarias
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona las entidades bancarias del sistema
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Entidad
        </Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Código</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-32">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {showCreate && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newForm.nombre}
                      onChange={(e) =>
                        setNewForm((f) => ({ ...f, nombre: e.target.value }))
                      }
                      placeholder="Nombre"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreate();
                        if (e.key === "Escape") setShowCreate(false);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={newForm.codigo}
                      onChange={(e) =>
                        setNewForm((f) => ({ ...f, codigo: e.target.value }))
                      }
                      placeholder="Código"
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
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
                      Cargando...
                    </div>
                  </TableCell>
                </TableRow>
              ) : entidades.length === 0 && !showCreate ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <EmptyState
                      illustration={<EmptyFinance className="w-full h-full" />}
                      title="No hay entidades bancarias"
                      size="sm"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                entidades.map((e: any) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      {editId === e.id ? (
                        <Input
                          value={editForm.nombre}
                          onChange={(ev) =>
                            setEditForm((f) => ({
                              ...f,
                              nombre: ev.target.value,
                            }))
                          }
                          autoFocus
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter") handleUpdate();
                            if (ev.key === "Escape") setEditId(null);
                          }}
                        />
                      ) : (
                        <span className="font-medium">{e.nombre}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editId === e.id ? (
                        <Input
                          value={editForm.codigo}
                          onChange={(ev) =>
                            setEditForm((f) => ({
                              ...f,
                              codigo: ev.target.value,
                            }))
                          }
                          onKeyDown={(ev) => {
                            if (ev.key === "Enter") handleUpdate();
                            if (ev.key === "Escape") setEditId(null);
                          }}
                        />
                      ) : (
                        <Badge
                          variant="secondary"
                          className="border-0 font-mono text-xs"
                        >
                          {e.codigo || "-"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`border-0 text-xs font-medium ${
                          e.activo
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400"
                        }`}
                      >
                        {e.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {editId === e.id ? (
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
                              setEditId(e.id);
                              setEditForm({
                                nombre: e.nombre,
                                codigo: e.codigo || "",
                              });
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setDeleteId(e.id)}
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
            <AlertDialogTitle>Eliminar entidad bancaria</AlertDialogTitle>
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
