import type { Rol } from "./roles";

export const Permission = {
  // Employees
  EMPLOYEES_VIEW: "employees:view",
  EMPLOYEES_CREATE: "employees:create",
  EMPLOYEES_EDIT: "employees:edit",
  EMPLOYEES_DELETE: "employees:delete",
  EMPLOYEES_ASSIGN: "employees:assign",
  // Sales - Clients
  CLIENTS_VIEW: "clients:view",
  CLIENTS_MANAGE: "clients:manage",
  // Sales - Orders
  ORDERS_VIEW: "orders:view",
  ORDERS_CREATE: "orders:create",
  ORDERS_EDIT: "orders:edit",
  ORDERS_APPROVE: "orders:approve",
  ORDERS_CANCEL: "orders:cancel",
  ORDERS_ASSIGN_ROUTE: "orders:assign_route",
  // Inventory
  PRODUCTS_VIEW: "products:view",
  PRODUCTS_MANAGE: "products:manage",
  STOCK_VIEW: "stock:view",
  STOCK_ADJUST: "stock:adjust",
  STOCK_TRANSFER: "stock:transfer",
  // Invoices
  INVOICES_VIEW: "invoices:view",
  INVOICES_CREATE: "invoices:create",
  INVOICES_CANCEL: "invoices:cancel",
  // Finance
  FINANCE_VIEW: "finance:view",
  FINANCE_CASH_REGISTER: "finance:cash_register",
  FINANCE_EXPENSES: "finance:expenses",
  FINANCE_CHECKS: "finance:checks",
  FINANCE_BUDGETS: "finance:budgets",
  FINANCE_REPORTS: "finance:reports",
  // Delivery
  DELIVERY_VIEW: "delivery:view",
  DELIVERY_MANAGE: "delivery:manage",
  DELIVERY_UPDATE: "delivery:update",
  DELIVERY_COLLECT: "delivery:collect",
  // Purchases
  SUPPLIERS_VIEW: "suppliers:view",
  SUPPLIERS_MANAGE: "suppliers:manage",
  PURCHASES_VIEW: "purchases:view",
  PURCHASES_CREATE: "purchases:create",
  PURCHASES_APPROVE: "purchases:approve",
  PURCHASES_CANCEL: "purchases:cancel",
  // System
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
  REPORTS_VIEW: "reports:view",
  REPORTS_EXPORT: "reports:export",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const PERMISSIONS: Permission[] = Object.values(Permission);

export interface PermissionModule {
  label: string;
  permissions: { value: Permission; label: string }[];
}

export const PERMISSION_MODULES: PermissionModule[] = [
  {
    label: "Empleados",
    permissions: [
      { value: "employees:view", label: "Ver empleados" },
      { value: "employees:create", label: "Crear empleados" },
      { value: "employees:edit", label: "Editar empleados" },
      { value: "employees:delete", label: "Eliminar empleados" },
      { value: "employees:assign", label: "Asignar sucursales" },
    ],
  },
  {
    label: "Ventas - Clientes",
    permissions: [
      { value: "clients:view", label: "Ver clientes" },
      { value: "clients:manage", label: "Gestionar clientes" },
    ],
  },
  {
    label: "Ventas - Pedidos",
    permissions: [
      { value: "orders:view", label: "Ver pedidos" },
      { value: "orders:create", label: "Crear pedidos" },
      { value: "orders:edit", label: "Editar pedidos" },
      { value: "orders:approve", label: "Aprobar pedidos" },
      { value: "orders:cancel", label: "Cancelar pedidos" },
      { value: "orders:assign_route", label: "Asignar ruta" },
    ],
  },
  {
    label: "Ventas - Facturas",
    permissions: [
      { value: "invoices:view", label: "Ver facturas" },
      { value: "invoices:create", label: "Crear facturas" },
      { value: "invoices:cancel", label: "Anular facturas" },
    ],
  },
  {
    label: "Inventario",
    permissions: [
      { value: "products:view", label: "Ver productos" },
      { value: "products:manage", label: "Gestionar productos" },
      { value: "stock:view", label: "Ver stock" },
      { value: "stock:adjust", label: "Ajustar stock" },
      { value: "stock:transfer", label: "Transferir stock" },
    ],
  },
  {
    label: "Finanzas",
    permissions: [
      { value: "finance:view", label: "Ver finanzas" },
      { value: "finance:cash_register", label: "Caja registradora" },
      { value: "finance:expenses", label: "Gastos" },
      { value: "finance:checks", label: "Cheques" },
      { value: "finance:budgets", label: "Presupuestos" },
      { value: "finance:reports", label: "Reportes financieros" },
    ],
  },
  {
    label: "Entregas",
    permissions: [
      { value: "delivery:view", label: "Ver entregas" },
      { value: "delivery:manage", label: "Gestionar entregas" },
      { value: "delivery:update", label: "Actualizar estado" },
      { value: "delivery:collect", label: "Cobrar en entrega" },
    ],
  },
  {
    label: "Compras",
    permissions: [
      { value: "suppliers:view", label: "Ver proveedores" },
      { value: "suppliers:manage", label: "Gestionar proveedores" },
      { value: "purchases:view", label: "Ver ordenes de compra" },
      { value: "purchases:create", label: "Crear ordenes de compra" },
      { value: "purchases:approve", label: "Aprobar ordenes de compra" },
      { value: "purchases:cancel", label: "Cancelar ordenes de compra" },
    ],
  },
  {
    label: "Sistema",
    permissions: [
      { value: "settings:view", label: "Ver configuración" },
      { value: "settings:manage", label: "Gestionar configuración" },
      { value: "reports:view", label: "Ver reportes" },
      { value: "reports:export", label: "Exportar reportes" },
    ],
  },
];

export const PERMISSION_LABELS: Record<Permission, string> = Object.fromEntries(
  PERMISSION_MODULES.flatMap((m) =>
    m.permissions.map((p) => [p.value, p.label])
  )
) as Record<Permission, string>;

export const DEFAULT_ROLE_PERMISSIONS: Record<Rol, Permission[]> = {
  ADMIN: [...PERMISSIONS],
  SUPERVISOR: [
    "employees:view", "employees:create", "employees:edit", "employees:delete", "employees:assign",
    "clients:view", "clients:manage",
    "orders:view", "orders:create", "orders:edit", "orders:approve", "orders:cancel", "orders:assign_route",
    "invoices:view", "invoices:create", "invoices:cancel",
    "products:view", "products:manage", "stock:view", "stock:adjust",
    "finance:view", "finance:cash_register", "finance:expenses", "finance:checks", "finance:budgets", "finance:reports",
    "delivery:view", "delivery:manage",
    "suppliers:view", "suppliers:manage", "purchases:view", "purchases:create", "purchases:approve", "purchases:cancel",
    "settings:view",
    "reports:view", "reports:export",
  ],
  JEFE_VENTAS: [
    "employees:view",
    "clients:view", "clients:manage",
    "orders:view", "orders:create", "orders:edit", "orders:approve", "orders:cancel",
    "invoices:view", "invoices:create",
    "products:view",
    "delivery:view",
    "reports:view",
  ],
  VENDEDOR: [
    "clients:view", "clients:manage",
    "orders:view", "orders:create", "orders:edit",
    "invoices:view",
    "products:view",
  ],
  VENDEDOR_CALLE: [
    "clients:view", "clients:manage",
    "orders:view", "orders:create",
    "products:view",
  ],
  DEPOSITO: [
    "orders:view",
    "products:view", "products:manage", "stock:view", "stock:adjust", "stock:transfer",
    "delivery:view",
    "suppliers:view", "purchases:view",
  ],
  FINANZAS: [
    "clients:view",
    "orders:view",
    "invoices:view", "invoices:create", "invoices:cancel",
    "finance:view", "finance:cash_register", "finance:expenses", "finance:checks", "finance:budgets", "finance:reports",
    "suppliers:view", "purchases:view",
    "reports:view", "reports:export",
  ],
  REPARTIDOR: [
    "orders:view",
    "delivery:view", "delivery:update", "delivery:collect",
  ],
};

export interface PermissionOverride {
  permission: Permission;
  granted: boolean;
}

export function resolvePermissions(
  role: Rol,
  overrides: PermissionOverride[] = []
): Permission[] {
  if (role === "ADMIN") return [...PERMISSIONS];

  const defaults = new Set(DEFAULT_ROLE_PERMISSIONS[role] || []);

  for (const override of overrides) {
    if (override.granted) {
      defaults.add(override.permission);
    } else {
      defaults.delete(override.permission);
    }
  }

  return [...defaults];
}
