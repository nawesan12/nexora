"use client";

import { useState, useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  taskSchema,
  taskCommentSchema,
  type TaskInput,
  type TaskCommentInput,
} from "@pronto/shared/schemas";
import {
  useTask,
  useUpdateTask,
  useDeleteTask,
  useTaskComments,
  useCreateTaskComment,
} from "@/hooks/queries/use-tasks";
import { useEmpleados } from "@/hooks/queries/use-employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
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
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  CheckSquare,
  Trash2,
  MessageSquare,
  Send,
  Clock,
  User,
} from "lucide-react";
import gsap from "gsap";

const PRIORIDAD_COLORS: Record<string, string> = {
  URGENTE:
    "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800",
  ALTA: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  MEDIA:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  BAJA: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800",
};

const ESTADO_COLORS: Record<string, string> = {
  PENDIENTE:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  EN_PROGRESO:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  COMPLETADA:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELADA:
    "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
};

const ESTADO_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En Progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

export default function TaskDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { data: task, isLoading } = useTask(id);
  const { data: comments } = useTaskComments(id);
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const createCommentMutation = useCreateTaskComment();
  const { data: empData } = useEmpleados({ page: 1, pageSize: 100 });
  const empleados = empData?.data || [];

  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      titulo: "",
      descripcion: "",
      prioridad: "MEDIA",
      estado: "PENDIENTE",
      asignado_a: "",
      fecha_limite: "",
    },
  });

  const commentForm = useForm<TaskCommentInput>({
    resolver: zodResolver(taskCommentSchema),
    defaultValues: { contenido: "" },
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".task-detail",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // Populate form when task loads and editing starts
  const handleStartEdit = () => {
    if (!task) return;
    form.reset({
      titulo: task.titulo,
      descripcion: task.descripcion || "",
      prioridad: task.prioridad as TaskInput["prioridad"],
      estado: task.estado as TaskInput["estado"],
      asignado_a: task.asignado_a || "",
      fecha_limite: task.fecha_limite || "",
    });
    setEditing(true);
  };

  const handleSave = (data: TaskInput) => {
    updateMutation.mutate(
      { id, data },
      {
        onSuccess: () => setEditing(false),
      }
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(id, {
      onSuccess: () => router.push("/administracion/tareas"),
    });
  };

  const handleComment = (data: TaskCommentInput) => {
    createCommentMutation.mutate(
      { taskId: id, data },
      { onSuccess: () => commentForm.reset({ contenido: "" }) }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Tarea no encontrada</p>
      </div>
    );
  }

  const commentList = Array.isArray(comments) ? comments : [];

  return (
    <div ref={containerRef} className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/administracion/tareas">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{task.titulo}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant="outline"
                className={`text-xs border ${PRIORIDAD_COLORS[task.prioridad] || ""}`}
              >
                {task.prioridad}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs border-0 ${ESTADO_COLORS[task.estado] || ""}`}
              >
                {ESTADO_LABELS[task.estado] || task.estado}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!editing && (
            <Button variant="outline" onClick={handleStartEdit}>
              Editar
            </Button>
          )}
          <Button
            variant="destructive"
            size="icon"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="task-detail grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {editing ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Editar Tarea
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSave)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="titulo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Titulo</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="descripcion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripcion</FormLabel>
                          <FormControl>
                            <Textarea rows={4} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="prioridad"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridad</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="BAJA">Baja</SelectItem>
                                <SelectItem value="MEDIA">Media</SelectItem>
                                <SelectItem value="ALTA">Alta</SelectItem>
                                <SelectItem value="URGENTE">Urgente</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="estado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="PENDIENTE">
                                  Pendiente
                                </SelectItem>
                                <SelectItem value="EN_PROGRESO">
                                  En Progreso
                                </SelectItem>
                                <SelectItem value="COMPLETADA">
                                  Completada
                                </SelectItem>
                                <SelectItem value="CANCELADA">
                                  Cancelada
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="asignado_a"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Asignado a</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sin asignar" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Sin asignar</SelectItem>
                                {empleados.map((emp) => (
                                  <SelectItem key={emp.id} value={emp.id}>
                                    {emp.nombre} {emp.apellido}
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
                        name="fecha_limite"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Fecha limite</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={updateMutation.isPending}
                      >
                        {updateMutation.isPending
                          ? "Guardando..."
                          : "Guardar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Descripcion</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {task.descripcion || "Sin descripcion."}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Comments section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Comentarios ({commentList.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comment form */}
              <form
                onSubmit={commentForm.handleSubmit(handleComment)}
                className="flex gap-2"
              >
                <Textarea
                  placeholder="Escribe un comentario..."
                  className="min-h-[60px]"
                  {...commentForm.register("contenido")}
                />
                <Button
                  type="submit"
                  size="icon"
                  className="shrink-0 self-end"
                  disabled={createCommentMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>

              {commentList.length > 0 && <Separator />}

              {/* Comment timeline */}
              <div className="space-y-4">
                {commentList.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {comment.usuario_nombre || "Usuario"}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(comment.created_at).toLocaleString("es-AR")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {comment.contenido}
                      </p>
                    </div>
                  </div>
                ))}
                {commentList.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay comentarios aun.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Detalles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Prioridad</p>
                <Badge
                  variant="outline"
                  className={`text-xs border ${PRIORIDAD_COLORS[task.prioridad] || ""}`}
                >
                  {task.prioridad}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Estado</p>
                <Badge
                  variant="secondary"
                  className={`text-xs border-0 ${ESTADO_COLORS[task.estado] || ""}`}
                >
                  {ESTADO_LABELS[task.estado] || task.estado}
                </Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Asignado a
                </p>
                <p className="text-sm font-medium">
                  {task.asignado_nombre || "Sin asignar"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Fecha limite
                </p>
                <p className="text-sm font-medium">
                  {task.fecha_limite
                    ? new Date(task.fecha_limite).toLocaleDateString("es-AR")
                    : "Sin fecha"}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">Creada</p>
                <p className="text-sm">
                  {new Date(task.created_at).toLocaleString("es-AR")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete dialog */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar tarea</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. La tarea sera eliminada
              permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
