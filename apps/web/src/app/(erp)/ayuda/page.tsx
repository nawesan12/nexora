"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Keyboard,
  Package,
  ShoppingCart,
  Users,
  DollarSign,
  Truck,
  BarChart3,
  Settings,
  HelpCircle,
  Mail,
} from "lucide-react";

const shortcuts = [
  { keys: "Alt + D", description: "Ir al Dashboard" },
  { keys: "Alt + P", description: "Ir a Pedidos" },
  { keys: "Alt + C", description: "Ir a Clientes" },
  { keys: "Alt + I", description: "Ir a Inventario" },
  { keys: "Alt + F", description: "Ir a Finanzas" },
  { keys: "Alt + N", description: "Nuevo pedido" },
  { keys: "Ctrl + K", description: "Abrir busqueda de paginas" },
];

const modules = [
  {
    title: "Ventas",
    icon: ShoppingCart,
    description:
      "Gestion completa de pedidos con un ciclo de vida de 16 estados, desde la creacion hasta la entrega. Incluye facturacion electronica con integracion AFIP, remitos de entrega, y sistema de aprobaciones por rol.",
  },
  {
    title: "Inventario",
    icon: Package,
    description:
      "Control de stock por sucursal con catalogo de productos, familias y categorias. Soporta movimientos de stock (ajustes, quiebres, devoluciones), transferencias entre sucursales, y exportacion de catalogos en CSV.",
  },
  {
    title: "Clientes",
    icon: Users,
    description:
      "Base de datos de clientes con multiples direcciones, condicion IVA, y sistema de reputacion. Incluye gestion de limites de credito y saldos pendientes.",
  },
  {
    title: "Finanzas",
    icon: DollarSign,
    description:
      "Gestion de cajas (efectivo y banco), movimientos, arqueos de caja, cheques con transiciones de estado, gastos operativos y recurrentes, presupuestos, y comisiones de vendedores. Incluye conciliacion bancaria.",
  },
  {
    title: "Logistica",
    icon: Truck,
    description:
      "Planificacion de repartos con asignacion de vehiculos y zonas. Rutas reutilizables con paradas por cliente. Seguimiento en tiempo real con GPS y WebSocket. Registro de eventos de entrega.",
  },
  {
    title: "Reportes",
    icon: BarChart3,
    description:
      "Reportes de ventas, compras, inventario, finanzas y rentabilidad de productos. Filtrado por periodo y sucursal. Exportacion a CSV. Dashboard con KPIs en tiempo real.",
  },
  {
    title: "Configuracion",
    icon: Settings,
    description:
      "Gestion de sucursales, impuestos, metodos de pago, entidades bancarias, permisos por rol, integracion AFIP, y configuracion de empresa.",
  },
];

const faqs = [
  {
    question: "Como creo un nuevo pedido?",
    answer:
      "Navega a Ventas > Pedidos y haz clic en 'Nuevo Pedido'. Selecciona el cliente, agrega productos al carrito, configura impuestos y descuentos, y confirma el pedido. Tambien puedes usar el atajo Alt+N.",
  },
  {
    question: "Como genero una factura electronica?",
    answer:
      "Primero configura AFIP en Configuracion > AFIP con el certificado y clave privada de tu empresa. Luego, desde el detalle de un pedido aprobado, haz clic en 'Facturar'. La factura puede autorizarse automaticamente con AFIP para obtener el CAE.",
  },
  {
    question: "Como funciona el sistema de permisos?",
    answer:
      "Pronto usa un sistema hibrido con 8 roles fijos y 36 permisos granulares. Los permisos pueden activarse o desactivarse por rol desde Configuracion > Permisos. Cada accion en el sistema verifica los permisos del usuario.",
  },
  {
    question: "Como hago una transferencia de stock entre sucursales?",
    answer:
      "Ve a Inventario > Transferencias y crea una nueva solicitud. Selecciona sucursal de origen y destino, agrega los productos y cantidades. La transferencia pasa por estados: Pendiente > Aprobada > En Transito > Completada.",
  },
  {
    question: "Como configuro los repartos?",
    answer:
      "Crea rutas en Logistica > Rutas con las paradas y clientes habituales. Luego, desde una ruta puedes generar automaticamente un reparto que busca pedidos pendientes para cada cliente de la ruta.",
  },
  {
    question: "Como funciona el modo oscuro?",
    answer:
      "Haz clic en el icono de luna/sol en la barra superior para alternar entre modo claro y oscuro. El tema se guarda automaticamente en tu navegador.",
  },
];

export default function AyudaPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de Ayuda</h1>
        <p className="text-muted-foreground mt-1">
          Guia rapida para usar Pronto ERP
        </p>
      </div>

      {/* Keyboard Shortcuts */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Keyboard className="h-5 w-5 text-[var(--accent)]" />
            Atajos de teclado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Atajo</TableHead>
                <TableHead>Accion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shortcuts.map((s) => (
                <TableRow key={s.keys}>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="font-mono text-xs tracking-wider"
                    >
                      {s.keys}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{s.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modules */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5 text-[var(--accent)]" />
            Modulos del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {modules.map((m) => (
              <AccordionItem key={m.title} value={m.title}>
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
                      <m.icon className="h-4 w-4" />
                    </div>
                    {m.title}
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground pl-11">
                    {m.description}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HelpCircle className="h-5 w-5 text-[var(--accent)]" />
            Preguntas frecuentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-muted-foreground">
                    {faq.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Contact / Support */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="h-5 w-5 text-[var(--accent)]" />
            Soporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Si necesitas ayuda adicional o encontraste un problema, contacta al
              equipo de soporte.
            </p>
            <div className="rounded-lg border border-border/50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span className="text-muted-foreground">
                  soporte@pronto-erp.com
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Horario de atencion: Lunes a Viernes de 9:00 a 18:00 hs (GMT-3)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
