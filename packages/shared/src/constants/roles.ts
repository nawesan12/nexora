export const Rol = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  JEFE_VENTAS: "JEFE_VENTAS",
  VENDEDOR: "VENDEDOR",
  VENDEDOR_CALLE: "VENDEDOR_CALLE",
  DEPOSITO: "DEPOSITO",
  FINANZAS: "FINANZAS",
  REPARTIDOR: "REPARTIDOR",
} as const;

export type Rol = (typeof Rol)[keyof typeof Rol];

export const ROLES: Rol[] = Object.values(Rol);

export const ROLE_LABELS: Record<Rol, string> = {
  ADMIN: "Administrador",
  SUPERVISOR: "Supervisor",
  JEFE_VENTAS: "Jefe de Ventas",
  VENDEDOR: "Vendedor",
  VENDEDOR_CALLE: "Vendedor de Calle",
  DEPOSITO: "Depósito",
  FINANZAS: "Finanzas",
  REPARTIDOR: "Repartidor",
};

export const ROLE_DEFAULT_REDIRECT: Record<Rol, string> = {
  ADMIN: "/dashboard",
  SUPERVISOR: "/dashboard",
  JEFE_VENTAS: "/ventas/pedidos",
  VENDEDOR: "/ventas/pedidos",
  VENDEDOR_CALLE: "/ventas/pedidos",
  DEPOSITO: "/logistica/deposito",
  FINANZAS: "/finanzas",
  REPARTIDOR: "/logistica/repartos",
};
