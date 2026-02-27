// Delivery
export const EstadoReparto = {
  PLANIFICADO: "PLANIFICADO",
  EN_CURSO: "EN_CURSO",
  FINALIZADO: "FINALIZADO",
  CANCELADO: "CANCELADO",
} as const;
export type EstadoReparto = (typeof EstadoReparto)[keyof typeof EstadoReparto];

// Invoicing
export const TipoComprobante = {
  FACTURA: "FACTURA",
  NOTA_CREDITO: "NOTA_CREDITO",
  NOTA_DEBITO: "NOTA_DEBITO",
} as const;
export type TipoComprobante =
  (typeof TipoComprobante)[keyof typeof TipoComprobante];

export const TipoComprobanteLiteral = {
  A: "A",
  B: "B",
  N: "N",
  X: "X",
} as const;
export type TipoComprobanteLiteral =
  (typeof TipoComprobanteLiteral)[keyof typeof TipoComprobanteLiteral];

export const TipoVenta = {
  DISTRIBUIDORA: "DISTRIBUIDORA",
  POS: "POS",
} as const;
export type TipoVenta = (typeof TipoVenta)[keyof typeof TipoVenta];

// Customer
export const Reputacion = {
  DEUDOR: "DEUDOR",
  BUENA: "BUENA",
  CRITICA: "CRITICA",
  EXCELENTE: "EXCELENTE",
  NORMAL: "NORMAL",
} as const;
export type Reputacion = (typeof Reputacion)[keyof typeof Reputacion];

export const CondicionIVA = {
  RESPONSABLE_INSCRIPTO: "RESPONSABLE_INSCRIPTO",
  MONOTRIBUTO: "MONOTRIBUTO",
  EXENTO: "EXENTO",
  NO_RESPONSABLE: "NO_RESPONSABLE",
  CONSUMIDOR_FINAL: "CONSUMIDOR_FINAL",
} as const;
export type CondicionIVA = (typeof CondicionIVA)[keyof typeof CondicionIVA];

// Products
export const TipoTalle = {
  NUMERO: "NUMERO",
  LETRA: "LETRA",
} as const;
export type TipoTalle = (typeof TipoTalle)[keyof typeof TipoTalle];

export const UnidadDeMedida = {
  KG: "KG",
  UNIDAD: "UNIDAD",
  LITRO: "LITRO",
  METRO: "METRO",
  CAJA: "CAJA",
  BOLSA: "BOLSA",
  PACK: "PACK",
} as const;
export type UnidadDeMedida =
  (typeof UnidadDeMedida)[keyof typeof UnidadDeMedida];

// Finance
export const EstadoDeuda = {
  PENDIENTE: "PENDIENTE",
  PARCIAL: "PARCIAL",
  PAGADA: "PAGADA",
  VENCIDA: "VENCIDA",
} as const;
export type EstadoDeuda = (typeof EstadoDeuda)[keyof typeof EstadoDeuda];

export const EstadoCheque = {
  RECIBIDO: "RECIBIDO",
  DEPOSITADO: "DEPOSITADO",
  RECHAZADO: "RECHAZADO",
  ENDOSADO: "ENDOSADO",
  COBRADO: "COBRADO",
} as const;
export type EstadoCheque = (typeof EstadoCheque)[keyof typeof EstadoCheque];

export const EstadoArqueo = {
  PENDIENTE_REVISION: "PENDIENTE_REVISION",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
} as const;
export type EstadoArqueo = (typeof EstadoArqueo)[keyof typeof EstadoArqueo];

export const TipoMovimiento = {
  INGRESO: "INGRESO",
  EGRESO: "EGRESO",
  AJUSTE: "AJUSTE",
} as const;
export type TipoMovimiento =
  (typeof TipoMovimiento)[keyof typeof TipoMovimiento];

export const TipoMovimientoStock = {
  COMPRA: "COMPRA",
  VENTA: "VENTA",
  AJUSTE: "AJUSTE",
  TRANSFERENCIA: "TRANSFERENCIA",
  DEVOLUCION: "DEVOLUCION",
  QUIEBRE: "QUIEBRE",
} as const;
export type TipoMovimientoStock =
  (typeof TipoMovimientoStock)[keyof typeof TipoMovimientoStock];

export const TipoCaja = {
  EFECTIVO: "EFECTIVO",
  BANCO: "BANCO",
} as const;
export type TipoCaja = (typeof TipoCaja)[keyof typeof TipoCaja];

// Commissions & Promotions
export const TipoComision = {
  PORCENTAJE: "PORCENTAJE",
  FIJO: "FIJO",
  ESCALONADO: "ESCALONADO",
} as const;
export type TipoComision = (typeof TipoComision)[keyof typeof TipoComision];

export const TipoPromocion = {
  PORCENTAJE: "PORCENTAJE",
  CANTIDAD: "CANTIDAD",
  COMBO: "COMBO",
  REGALO: "REGALO",
  PRECIO_FIJO: "PRECIO_FIJO",
} as const;
export type TipoPromocion =
  (typeof TipoPromocion)[keyof typeof TipoPromocion];

export const TipoDescuento = {
  PORCENTAJE: "PORCENTAJE",
  MONTO_FIJO: "MONTO_FIJO",
} as const;
export type TipoDescuento =
  (typeof TipoDescuento)[keyof typeof TipoDescuento];

// HR
export const ModalidadTrabajo = {
  PRESENCIAL: "PRESENCIAL",
  REMOTO: "REMOTO",
  HIBRIDO: "HIBRIDO",
} as const;
export type ModalidadTrabajo =
  (typeof ModalidadTrabajo)[keyof typeof ModalidadTrabajo];

// Expenses
export const TipoGasto = {
  OPERATIVO: "OPERATIVO",
  ADMINISTRATIVO: "ADMINISTRATIVO",
  LOGISTICA: "LOGISTICA",
  COMERCIAL: "COMERCIAL",
  IMPOSITIVO: "IMPOSITIVO",
} as const;
export type TipoGasto = (typeof TipoGasto)[keyof typeof TipoGasto];

// Misc
export const EstadoBolsa = {
  ABIERTA: "ABIERTA",
  CERRADA: "CERRADA",
} as const;
export type EstadoBolsa = (typeof EstadoBolsa)[keyof typeof EstadoBolsa];

export const EstadoPresupuesto = {
  BORRADOR: "BORRADOR",
  ENVIADO: "ENVIADO",
  APROBADO: "APROBADO",
  RECHAZADO: "RECHAZADO",
  VENCIDO: "VENCIDO",
} as const;
export type EstadoPresupuesto =
  (typeof EstadoPresupuesto)[keyof typeof EstadoPresupuesto];

export const TipoEvento = {
  LLEGADA: "LLEGADA",
  ENTREGA: "ENTREGA",
  NO_ENTREGA: "NO_ENTREGA",
  ENTREGA_PARCIAL: "ENTREGA_PARCIAL",
  COBRO: "COBRO",
} as const;
export type TipoEvento = (typeof TipoEvento)[keyof typeof TipoEvento];
