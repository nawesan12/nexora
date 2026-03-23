"use client";

import { useState, useMemo, useRef, useLayoutEffect } from "react";
import {
  useApiClients,
  useCreateApiClient,
  useUpdateApiClient,
  useDeleteApiClient,
  useRotateApiClientSecret,
} from "@/hooks/queries/use-api-clients";
import type { ApiClient, ApiClientCreateResult } from "@/lib/api-clients";
import type { ColumnDef } from "@tanstack/react-table";
import {
  DataTable,
  DataTableColumnHeader,
  DataTableRowActions,
  type RowAction,
} from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import {
  Plus,
  Pencil,
  Trash2,
  Cable,
  Copy,
  RefreshCw,
  ShieldAlert,
  Check,
} from "lucide-react";
import { EmptyGeneric } from "@/components/illustrations";
import gsap from "gsap";

export default function IntegracionesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useApiClients({ page, pageSize: 20 });
  const createMutation = useCreateApiClient();
  const updateMutation = useUpdateApiClient();
  const deleteMutation = useDeleteApiClient();
  const rotateMutation = useRotateApiClientSecret();

  const clients = data?.data || [];
  const meta = data?.meta;

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [rotateId, setRotateId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ApiClient | null>(null);

  // Secret reveal dialog
  const [secretResult, setSecretResult] = useState<ApiClientCreateResult | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Form state
  const [formNombre, setFormNombre] = useState("");
  const [formCorsOrigins, setFormCorsOrigins] = useState("");
  const [formActivo, setFormActivo] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".int-header",
        { y: -20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
      );
      gsap.fromTo(
        ".int-summary",
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: "power2.out", delay: 0.15 }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleOpenCreate = () => {
    setEditingClient(null);
    setFormNombre("");
    setFormCorsOrigins("");
    setFormActivo(true);
    setDialogOpen(true);
  };

  const handleOpenEdit = (client: ApiClient) => {
    setEditingClient(client);
    setFormNombre(client.nombre);
    setFormCorsOrigins(client.cors_origins.join("\n"));
    setFormActivo(client.activo);
    setDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const origins = formCorsOrigins
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingClient) {
      updateMutation.mutate(
        {
          id: editingClient.id,
          data: { nombre: formNombre, cors_origins: origins, activo: formActivo },
        },
        {
          onSuccess: () => {
            setDialogOpen(false);
            setEditingClient(null);
          },
        }
      );
    } else {
      createMutation.mutate(
        { nombre: formNombre, cors_origins: origins },
        {
          onSuccess: (result) => {
            setDialogOpen(false);
            setSecretResult(result as ApiClientCreateResult);
          },
        }
      );
    }
  };

  const handleRotateConfirm = () => {
    if (!rotateId) return;
    rotateMutation.mutate(rotateId, {
      onSuccess: (result) => {
        setRotateId(null);
        setSecretResult(result as ApiClientCreateResult);
      },
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const truncateKey = (key: string) => {
    if (!key) return "";
    if (key.length <= 12) return key;
    return key.slice(0, 8) + "..." + key.slice(-4);
  };

  const columns = useMemo<ColumnDef<ApiClient, unknown>[]>(
    () => [
      {
        accessorKey: "nombre",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Nombre" />
        ),
        cell: ({ row }) => (
          <span className="font-medium">{row.getValue("nombre")}</span>
        ),
        enableHiding: false,
      },
      {
        accessorKey: "api_key",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="API Key" />
        ),
        cell: ({ row }) => {
          const key = row.getValue("api_key") as string;
          return (
            <div className="flex items-center gap-2">
              <code className="rounded bg-muted px-2 py-0.5 text-xs font-mono">
                {truncateKey(key)}
              </code>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(key);
                }}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: "activo",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Estado" />
        ),
        cell: ({ row }) => {
          const activo = row.getValue("activo") as boolean;
          return (
            <Badge variant={activo ? "default" : "secondary"}>
              {activo ? "Activo" : "Inactivo"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "cors_origins",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="CORS Origins" />
        ),
        cell: ({ row }) => {
          const origins = row.getValue("cors_origins") as string[];
          return (
            <Badge variant="outline" className="text-xs">
              {origins?.length || 0} origen{(origins?.length || 0) !== 1 ? "es" : ""}
            </Badge>
          );
        },
      },
      {
        accessorKey: "last_used_at",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Ultimo uso" />
        ),
        cell: ({ row }) => {
          const date = row.getValue("last_used_at") as string;
          return date ? (
            <span className="text-sm text-muted-foreground">
              {new Date(date).toLocaleDateString("es-AR")}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/50">Nunca</span>
          );
        },
      },
      {
        id: "actions",
        header: () => (
          <span className="text-xs font-semibold uppercase tracking-wider">
            Acciones
          </span>
        ),
        cell: ({ row }) => {
          const client = row.original;
          const actions: RowAction[] = [
            {
              label: "Editar",
              icon: <Pencil className="h-4 w-4" />,
              onClick: () => handleOpenEdit(client),
            },
            {
              label: "Rotar secreto",
              icon: <RefreshCw className="h-4 w-4" />,
              onClick: () => setRotateId(client.id),
            },
            {
              label: "Eliminar",
              icon: <Trash2 className="h-4 w-4" />,
              onClick: () => setDeleteId(client.id),
              variant: "destructive",
              separator: true,
            },
          ];
          return (
            <div onClick={(ev) => ev.stopPropagation()}>
              <DataTableRowActions actions={actions} />
            </div>
          );
        },
        enableSorting: false,
        enableHiding: false,
        size: 60,
      },
    ],
    []
  );

  return (
    <div ref={containerRef} className="space-y-5">
      <div className="int-header flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Integraciones
          </h1>
          <p className="text-sm text-muted-foreground">
            Administra los clientes de la API para integraciones externas
          </p>
        </div>
        <Button className="shadow-sm" onClick={handleOpenCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo API Client
        </Button>
      </div>

      {meta && (
        <div className="int-summary flex items-center gap-3 rounded-xl border border-border/50 bg-gradient-to-r from-[var(--accent)]/5 to-transparent px-5 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Cable className="h-4 w-4" />
          </div>
          <span className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{meta.total}</span>{" "}
            API clients
          </span>
        </div>
      )}

      <DataTable
        columns={columns}
        data={clients}
        page={page}
        pageSize={20}
        totalPages={meta?.totalPages || 1}
        totalItems={meta?.total}
        onPageChange={setPage}
        searchKey="nombre"
        searchPlaceholder="Buscar por nombre..."
        isLoading={isLoading}
        emptyIllustration={<EmptyGeneric className="w-full h-full" />}
        emptyMessage="No se encontraron API clients"
        emptyDescription="Crea un nuevo API client para integrar servicios externos."
        emptyAction={{ label: "Nuevo API Client", onClick: handleOpenCreate }}
      />

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingClient ? "Editar API Client" : "Nuevo API Client"}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? "Modifica la configuracion del API client."
                : "Crea un nuevo API client para integraciones."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                placeholder="Ej: App Movil"
                value={formNombre}
                onChange={(e) => setFormNombre(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cors_origins">CORS Origins (uno por linea)</Label>
              <Textarea
                id="cors_origins"
                placeholder="https://example.com&#10;https://app.example.com"
                value={formCorsOrigins}
                onChange={(e) => setFormCorsOrigins(e.target.value)}
                rows={4}
              />
            </div>
            {editingClient && (
              <div className="flex items-center gap-3">
                <Switch
                  id="activo"
                  checked={formActivo}
                  onCheckedChange={setFormActivo}
                />
                <Label htmlFor="activo">Activo</Label>
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createMutation.isPending || updateMutation.isPending
                }
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Guardando..."
                  : editingClient
                    ? "Actualizar"
                    : "Crear"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Secret reveal dialog */}
      <Dialog
        open={!!secretResult}
        onOpenChange={() => setSecretResult(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-500" />
              Secreto del API Client
            </DialogTitle>
            <DialogDescription>
              Este secreto solo se mostrara una vez. Copialo ahora y guardalo en
              un lugar seguro.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-muted px-3 py-2 text-sm font-mono break-all">
                  {secretResult?.api_key}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(secretResult?.api_key || "")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>API Secret</Label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm font-mono break-all text-destructive">
                  {secretResult?.api_secret}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    copyToClipboard(secretResult?.api_secret || "")
                  }
                >
                  {copiedSecret ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Este secreto no se puede recuperar. Si lo pierdes, deberas rotar
                las credenciales.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setSecretResult(null)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rotate secret confirmation */}
      <AlertDialog open={!!rotateId} onOpenChange={() => setRotateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rotar secreto del API client</AlertDialogTitle>
            <AlertDialogDescription>
              El secreto actual dejara de funcionar inmediatamente. Todas las
              integraciones que lo usen dejaran de autenticarse.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRotateConfirm}>
              {rotateMutation.isPending ? "Rotando..." : "Rotar Secreto"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar API client</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. El API client sera eliminado
              permanentemente.
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
