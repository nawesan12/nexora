import type { Permission } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Users,
  Warehouse,
  DollarSign,
  Truck,
  Settings,
  BarChart3,
  Landmark,
  Receipt,
  Wallet,
  ArrowLeftRight,
  GitBranch,
  CarFront,
  MapPin,
  FileText,
  Building2,
  ClipboardList,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  permission?: Permission;
  badge?: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    title: "General",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "Ventas",
    items: [
      {
        title: "Pedidos",
        href: "/ventas/pedidos",
        icon: ShoppingCart,
        permission: "orders:view",
      },
      {
        title: "Facturas",
        href: "/ventas/facturas",
        icon: FileText,
        permission: "invoices:view",
      },
      {
        title: "Clientes",
        href: "/ventas/clientes",
        icon: Users,
        permission: "clients:view",
      },
    ],
  },
  {
    title: "Compras",
    items: [
      {
        title: "Proveedores",
        href: "/compras/proveedores",
        icon: Building2,
        permission: "suppliers:view",
      },
      {
        title: "Ordenes de Compra",
        href: "/compras/ordenes",
        icon: ClipboardList,
        permission: "purchases:view",
      },
    ],
  },
  {
    title: "Inventario",
    items: [
      {
        title: "Productos",
        href: "/inventario/productos",
        icon: Package,
        permission: "products:view",
      },
      {
        title: "Stock",
        href: "/inventario",
        icon: Warehouse,
        permission: "stock:view",
      },
      {
        title: "Movimientos",
        href: "/inventario/movimientos",
        icon: GitBranch,
        permission: "stock:view",
      },
      {
        title: "Transferencias",
        href: "/inventario/transferencias",
        icon: ArrowLeftRight,
        permission: "stock:view",
      },
    ],
  },
  {
    title: "Logistica",
    items: [
      {
        title: "Repartos",
        href: "/logistica/repartos",
        icon: Truck,
        permission: "delivery:view",
      },
      {
        title: "Vehiculos",
        href: "/logistica/vehiculos",
        icon: CarFront,
        permission: "delivery:view",
      },
      {
        title: "Zonas",
        href: "/logistica/zonas",
        icon: MapPin,
        permission: "delivery:view",
      },
    ],
  },
  {
    title: "Finanzas",
    items: [
      {
        title: "Resumen",
        href: "/finanzas",
        icon: DollarSign,
        permission: "finance:view",
      },
      {
        title: "Cajas",
        href: "/finanzas/cajas",
        icon: Landmark,
        permission: "finance:view",
      },
      {
        title: "Cheques",
        href: "/finanzas/cheques",
        icon: Receipt,
        permission: "finance:view",
      },
      {
        title: "Gastos",
        href: "/finanzas/gastos",
        icon: Wallet,
        permission: "finance:view",
      },
    ],
  },
  {
    title: "Administracion",
    items: [
      {
        title: "Empleados",
        href: "/empleados",
        icon: Users,
        permission: "employees:view",
      },
      {
        title: "Reportes",
        href: "/reportes",
        icon: BarChart3,
        permission: "reports:view",
      },
    ],
  },
  {
    title: "Configuracion",
    items: [
      {
        title: "General",
        href: "/configuracion",
        icon: Settings,
        permission: "settings:view",
      },
      {
        title: "Sucursales",
        href: "/configuracion/sucursales",
        icon: Building2,
        permission: "settings:view",
      },
      {
        title: "Impuestos",
        href: "/configuracion/impuestos",
        icon: Receipt,
        permission: "settings:view",
      },
      {
        title: "AFIP",
        href: "/configuracion/afip",
        icon: ShieldCheck,
        permission: "settings:manage",
      },
      {
        title: "Permisos",
        href: "/configuracion/permisos",
        icon: Settings,
        permission: "settings:manage",
      },
    ],
  },
];

export function filterNavByPermissions(permissions: string[]): NavSection[] {
  return navigation
    .map((section) => ({
      ...section,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(permissions, item.permission),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
