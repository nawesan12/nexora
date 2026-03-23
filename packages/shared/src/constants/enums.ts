// Invoicing - Estado
export const EstadoComprobante = {
  BORRADOR: "BORRADOR",
  EMITIDO: "EMITIDO",
  ANULADO: "ANULADO",
} as const;
export type EstadoComprobante =
  (typeof EstadoComprobante)[keyof typeof EstadoComprobante];

export const ESTADO_COMPROBANTE_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  EMITIDO: "Emitido",
  ANULADO: "Anulado",
};

export const TIPO_COMPROBANTE_LABELS: Record<string, string> = {
  FACTURA: "Factura",
  NOTA_CREDITO: "Nota de Crédito",
  NOTA_DEBITO: "Nota de Débito",
};

export const LETRA_COMPROBANTE_LABELS: Record<string, string> = {
  A: "A",
  B: "B",
  C: "C",
  N: "N",
  X: "X",
};

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

// Employee HR
export const EstadoEmpleado = {
  ACTIVO: "ACTIVO",
  LICENCIA: "LICENCIA",
  DESVINCULADO: "DESVINCULADO",
} as const;
export type EstadoEmpleado = (typeof EstadoEmpleado)[keyof typeof EstadoEmpleado];

export const TipoContrato = {
  RELACION_DEPENDENCIA: "RELACION_DEPENDENCIA",
  MONOTRIBUTO: "MONOTRIBUTO",
  EVENTUAL: "EVENTUAL",
} as const;
export type TipoContrato = (typeof TipoContrato)[keyof typeof TipoContrato];

export const ESTADO_EMPLEADO_LABELS: Record<string, string> = {
  ACTIVO: "Activo",
  LICENCIA: "Licencia",
  DESVINCULADO: "Desvinculado",
};

export const TIPO_CONTRATO_LABELS: Record<string, string> = {
  RELACION_DEPENDENCIA: "Rel. Dependencia",
  MONOTRIBUTO: "Monotributo",
  EVENTUAL: "Eventual",
};

// Estado Transferencia
export const EstadoTransferencia = {
  PENDIENTE: "PENDIENTE",
  APROBADA: "APROBADA",
  EN_TRANSITO: "EN_TRANSITO",
  COMPLETADA: "COMPLETADA",
  CANCELADA: "CANCELADA",
} as const;
export type EstadoTransferencia = (typeof EstadoTransferencia)[keyof typeof EstadoTransferencia];

export const ESTADO_TRANSFERENCIA_LABELS: Record<string, string> = {
  PENDIENTE: "Pendiente",
  APROBADA: "Aprobada",
  EN_TRANSITO: "En Tránsito",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

// Purchase Orders
export const EstadoOrdenCompra = {
  BORRADOR: "BORRADOR",
  APROBADA: "APROBADA",
  EN_RECEPCION: "EN_RECEPCION",
  RECIBIDA: "RECIBIDA",
  RECIBIDA_PARCIALMENTE: "RECIBIDA_PARCIALMENTE",
  CANCELADA: "CANCELADA",
} as const;
export type EstadoOrdenCompra = (typeof EstadoOrdenCompra)[keyof typeof EstadoOrdenCompra];

export const ESTADO_ORDEN_COMPRA_LABELS: Record<string, string> = {
  BORRADOR: "Borrador",
  APROBADA: "Aprobada",
  EN_RECEPCION: "En Recepción",
  RECIBIDA: "Recibida",
  RECIBIDA_PARCIALMENTE: "Recibida Parcialmente",
  CANCELADA: "Cancelada",
};

// Labels for existing enums that may be missing
export const ESTADO_REPARTO_LABELS: Record<string, string> = {
  PLANIFICADO: "Planificado",
  EN_CURSO: "En Curso",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const TIPO_EVENTO_LABELS: Record<string, string> = {
  LLEGADA: "Llegada",
  ENTREGA: "Entrega",
  NO_ENTREGA: "No Entrega",
  ENTREGA_PARCIAL: "Entrega Parcial",
  COBRO: "Cobro",
};

export const TIPO_MOVIMIENTO_STOCK_LABELS: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  AJUSTE: "Ajuste",
  TRANSFERENCIA: "Transferencia",
  DEVOLUCION: "Devolución",
  QUIEBRE: "Quiebre",
};
