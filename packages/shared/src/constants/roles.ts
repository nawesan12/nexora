export const Rol = {
  ADMIN: "ADMIN",
  VENDEDOR: "VENDEDOR",
  ENCARGADO: "ENCARGADO",
  ENCARGADO_DE_CALLE: "ENCARGADO_DE_CALLE",
  ENCARGADO_DEPOSITO: "ENCARGADO_DEPOSITO",
  FINANZAS: "FINANZAS",
  LOGISTICA: "LOGISTICA",
  REPARTIDOR: "REPARTIDOR",
  VENDEDOR_CALLE: "VENDEDOR_CALLE",
} as const;

export type Rol = (typeof Rol)[keyof typeof Rol];

export const ROLE_LABELS: Record<Rol, string> = {
  ADMIN: "Administrador",
  VENDEDOR: "Vendedor",
  ENCARGADO: "Encargado",
  ENCARGADO_DE_CALLE: "Encargado de Calle",
  ENCARGADO_DEPOSITO: "Encargado de Depósito",
  FINANZAS: "Finanzas",
  LOGISTICA: "Logística",
  REPARTIDOR: "Repartidor",
  VENDEDOR_CALLE: "Vendedor de Calle",
};

export const ROLE_DEFAULT_REDIRECT: Record<Rol, string> = {
  ADMIN: "/dashboard",
  VENDEDOR: "/ventas/pedidos",
  ENCARGADO: "/dashboard",
  ENCARGADO_DE_CALLE: "/ventas/pedidos",
  ENCARGADO_DEPOSITO: "/inventario",
  FINANZAS: "/finanzas",
  LOGISTICA: "/logistica/repartos",
  REPARTIDOR: "/logistica/repartos",
  VENDEDOR_CALLE: "/ventas/pedidos",
};
