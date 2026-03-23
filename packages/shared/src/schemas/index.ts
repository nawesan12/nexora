import { z } from "zod";

// CUIT validation (modulo-11 check digit algorithm)
const CUIT_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

function validateCuit(value: string): boolean {
  if (!value) return true; // empty is allowed
  const clean = value.replace(/-/g, "");
  if (clean.length !== 11 || !/^\d{11}$/.test(clean)) return false;
  const digits = clean.split("").map(Number);
  const sum = CUIT_WEIGHTS.reduce((acc, w, i) => acc + w * digits[i], 0);
  const remainder = sum % 11;
  const expected = remainder === 0 ? 0 : remainder === 1 ? 9 : 11 - remainder;
  return digits[10] === expected;
}

export const cuitSchema = z
  .string()
  .optional()
  .or(z.literal(""))
  .refine((val) => !val || validateCuit(val), {
    message: "CUIT inválido: dígito verificador incorrecto",
  });

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const accessCodeSchema = z.object({
  access_code: z
    .string()
    .min(4, "El código debe tener al menos 4 caracteres")
    .max(10, "El código no puede tener más de 10 caracteres"),
});

export const registerStep1Schema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
});

export const registerStep2Schema = z.object({
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export const registerStep3Schema = z.object({
  empresa: z.string().min(2, "El nombre de la empresa debe tener al menos 2 caracteres"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .regex(/[^A-Za-z0-9]/, "Debe contener al menos un carácter especial"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type AccessCodeInput = z.infer<typeof accessCodeSchema>;
export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Input = z.infer<typeof registerStep3Schema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

// Product schemas

export const familiaProductoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  descripcion: z.string().max(500).optional().or(z.literal("")),
});

export const categoriaProductoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  familia_id: z.string().uuid("Debe seleccionar una familia"),
});

export const productoSchema = z.object({
  codigo: z.string().max(50).optional().or(z.literal("")),
  codigo_barras: z.string().max(50).optional().or(z.literal("")),
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(300),
  descripcion: z.string().max(1000).optional().or(z.literal("")),
  precio_base: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  unidad: z.enum(["KG", "UNIDAD", "LITRO", "METRO", "CAJA", "BOLSA", "PACK"], {
    required_error: "Debe seleccionar una unidad",
  }),
  categoria_id: z.string().uuid("Debe seleccionar una categoría").optional().or(z.literal("")),
});

export const catalogoProductoSchema = z.object({
  producto_id: z.string().uuid("Debe seleccionar un producto"),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  precio: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  stock: z.coerce.number().int().min(0, "El stock debe ser mayor o igual a 0"),
});

export type FamiliaProductoInput = z.infer<typeof familiaProductoSchema>;
export type CategoriaProductoInput = z.infer<typeof categoriaProductoSchema>;
export type ProductoInput = z.infer<typeof productoSchema>;
export type CatalogoProductoInput = z.infer<typeof catalogoProductoSchema>;

// Client schemas

export const condicionIvaValues = [
  "RESPONSABLE_INSCRIPTO",
  "MONOTRIBUTO",
  "EXENTO",
  "NO_RESPONSABLE",
  "CONSUMIDOR_FINAL",
] as const;

export const reputacionValues = [
  "DEUDOR",
  "BUENA",
  "CRITICA",
  "EXCELENTE",
  "NORMAL",
] as const;

export const clienteSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  apellido: z.string().max(200).optional().or(z.literal("")),
  razon_social: z.string().max(300).optional().or(z.literal("")),
  cuit: z.string().max(20).optional().or(z.literal("")),
  condicion_iva: z.enum(condicionIvaValues, {
    required_error: "Debe seleccionar una condición de IVA",
  }),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  reputacion: z.enum(reputacionValues, {
    required_error: "Debe seleccionar una reputación",
  }),
});

export const direccionSchema = z.object({
  calle: z.string().min(2, "La calle debe tener al menos 2 caracteres").max(300),
  numero: z.string().max(20).optional().or(z.literal("")),
  piso: z.string().max(10).optional().or(z.literal("")),
  departamento: z.string().max(10).optional().or(z.literal("")),
  ciudad: z.string().max(100).optional().or(z.literal("")),
  provincia: z.string().max(100).optional().or(z.literal("")),
  codigo_postal: z.string().max(20).optional().or(z.literal("")),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  principal: z.boolean(),
});

export type ClienteInput = z.infer<typeof clienteSchema>;
export type DireccionInput = z.infer<typeof direccionSchema>;

// Employee schemas

export const rolValues = [
  "ADMIN",
  "SUPERVISOR",
  "JEFE_VENTAS",
  "VENDEDOR",
  "VENDEDOR_CALLE",
  "DEPOSITO",
  "FINANZAS",
  "REPARTIDOR",
] as const;

export const estadoEmpleadoValues = ["ACTIVO", "LICENCIA", "DESVINCULADO"] as const;
export const tipoContratoValues = ["RELACION_DEPENDENCIA", "MONOTRIBUTO", "EVENTUAL"] as const;

export const empleadoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  apellido: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  cuil: z.string().max(20).optional().or(z.literal("")),
  rol: z.enum(rolValues, {
    required_error: "Debe seleccionar un rol",
  }),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  // HR fields
  telefono: z.string().max(30).optional().or(z.literal("")),
  fecha_ingreso: z.string().optional().or(z.literal("")),
  fecha_egreso: z.string().optional().or(z.literal("")),
  estado: z.enum(estadoEmpleadoValues),
  dni: z.string().max(15).optional().or(z.literal("")),
  direccion: z.string().max(500).optional().or(z.literal("")),
  salario_base: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  tipo_contrato: z.enum(tipoContratoValues),
  obra_social: z.string().max(100).optional().or(z.literal("")),
  numero_legajo: z.string().max(20).optional().or(z.literal("")),
  banco: z.string().max(100).optional().or(z.literal("")),
  cbu: z.string().max(30).optional().or(z.literal("")),
});

export type EmpleadoInput = z.infer<typeof empleadoSchema>;

// Bulk operation schemas
export const bulkEstadoSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  estado: z.enum(estadoEmpleadoValues),
});

export const bulkRolSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  rol: z.enum(rolValues),
});

export const bulkBranchesSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  branch_ids: z.array(z.string().uuid()).min(1),
});

export type BulkEstadoInput = z.infer<typeof bulkEstadoSchema>;
export type BulkRolInput = z.infer<typeof bulkRolSchema>;
export type BulkBranchesInput = z.infer<typeof bulkBranchesSchema>;

// Order schemas

export const condicionPagoValues = [
  "CONTADO",
  "CUENTA_CORRIENTE",
  "CHEQUE",
  "TRANSFERENCIA",
  "OTRO",
] as const;

export const tipoImpuestoValues = [
  "IVA",
  "IIBB",
  "PERCEPCION_IVA",
  "PERCEPCION_IIBB",
  "OTRO",
] as const;

export const detalleItemSchema = z.object({
  producto_id: z.string().uuid("Debe seleccionar un producto"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
});

export const impuestoItemSchema = z.object({
  tipo: z.enum(tipoImpuestoValues, { required_error: "Seleccione un tipo" }),
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  porcentaje: z.coerce.number().min(0, "El porcentaje debe ser mayor o igual a 0"),
});

export const pedidoSchema = z.object({
  cliente_id: z.string().uuid("Debe seleccionar un cliente"),
  direccion_id: z.string().optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  empleado_id: z.string().optional().or(z.literal("")),
  condicion_pago: z.enum(condicionPagoValues, {
    required_error: "Debe seleccionar una condición de pago",
  }),
  fecha_entrega_estimada: z.string().optional().or(z.literal("")),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  observaciones_internas: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(detalleItemSchema).min(1, "Debe agregar al menos un producto"),
  impuestos: z.array(impuestoItemSchema),
});

export const transicionEstadoSchema = z.object({
  estado: z.string().min(1, "El estado es requerido"),
  empleado_id: z.string().optional().or(z.literal("")),
  comentario: z.string().max(500).optional().or(z.literal("")),
});

export const configuracionImpuestoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  tipo: z.enum(tipoImpuestoValues, { required_error: "Seleccione un tipo" }),
  porcentaje: z.coerce.number().min(0, "El porcentaje debe ser mayor o igual a 0"),
  aplicar_por_defecto: z.boolean(),
});

export type DetalleItemInput = z.infer<typeof detalleItemSchema>;
export type ImpuestoItemInput = z.infer<typeof impuestoItemSchema>;
export type PedidoInput = z.infer<typeof pedidoSchema>;
export type TransicionEstadoInput = z.infer<typeof transicionEstadoSchema>;
export type ConfiguracionImpuestoInput = z.infer<typeof configuracionImpuestoSchema>;

// Finance schemas

export const tipoCajaValues = ["EFECTIVO", "BANCO"] as const;
export const tipoMovimientoValues = ["INGRESO", "EGRESO", "AJUSTE"] as const;
export const estadoChequeValues = ["RECIBIDO", "DEPOSITADO", "RECHAZADO", "ENDOSADO", "COBRADO"] as const;
export const tipoGastoValues = ["OPERATIVO", "ADMINISTRATIVO", "LOGISTICA", "COMERCIAL", "IMPOSITIVO"] as const;
export const estadoPresupuestoValues = ["BORRADOR", "ENVIADO", "APROBADO", "RECHAZADO", "VENCIDO"] as const;
export const tipoComisionValues = ["PORCENTAJE", "FIJO", "ESCALONADO"] as const;
export const frecuenciaValues = ["DIARIA", "SEMANAL", "QUINCENAL", "MENSUAL", "BIMESTRAL", "TRIMESTRAL", "SEMESTRAL", "ANUAL"] as const;

export const cajaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  tipo: z.enum(tipoCajaValues, { required_error: "Debe seleccionar un tipo" }),
  saldo: z.coerce.number().min(0, "El saldo debe ser mayor o igual a 0"),
});

export const movimientoSchema = z.object({
  caja_id: z.string().uuid("Debe seleccionar una caja"),
  tipo: z.enum(tipoMovimientoValues, { required_error: "Debe seleccionar un tipo" }),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  concepto: z.string().min(1, "El concepto es requerido").max(500),
  referencia_id: z.string().uuid().optional().or(z.literal("")),
  referencia_tipo: z.string().max(50).optional().or(z.literal("")),
});

export const arqueoSchema = z.object({
  caja_id: z.string().uuid("Debe seleccionar una caja"),
  monto_fisico: z.coerce.number().min(0, "El monto debe ser mayor o igual a 0"),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  desglose: z.record(z.unknown()).optional(),
});

export const chequeSchema = z.object({
  numero: z.string().min(1, "El número es requerido").max(50),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  fecha_emision: z.string().min(1, "La fecha de emisión es requerida"),
  fecha_vencimiento: z.string().min(1, "La fecha de vencimiento es requerida"),
  banco: z.string().max(200).optional().or(z.literal("")),
  emisor: z.string().max(200).optional().or(z.literal("")),
  receptor: z.string().max(200).optional().or(z.literal("")),
  entidad_bancaria_id: z.string().uuid().optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
});

export const transicionChequeSchema = z.object({
  estado: z.enum(estadoChequeValues, { required_error: "Debe seleccionar un estado" }),
});

export const gastoSchema = z.object({
  concepto: z.string().min(1, "El concepto es requerido").max(500),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  categoria: z.enum(tipoGastoValues, { required_error: "Debe seleccionar una categoría" }),
  fecha: z.string().min(1, "La fecha es requerida"),
  comprobante: z.string().max(200).optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
});

export const gastoRecurrenteSchema = z.object({
  concepto: z.string().min(1, "El concepto es requerido").max(500),
  monto: z.coerce.number().positive("El monto debe ser mayor a 0"),
  categoria: z.enum(tipoGastoValues, { required_error: "Debe seleccionar una categoría" }),
  frecuencia: z.enum(frecuenciaValues, { required_error: "Debe seleccionar una frecuencia" }),
  proxima_fecha: z.string().min(1, "La próxima fecha es requerida"),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
});

export const metodoPagoSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido").max(200),
  tipo: z.string().min(1, "El tipo es requerido").max(50),
  comision_porcentaje: z.coerce.number().min(0).max(100),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
});

export const presupuestoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  monto_asignado: z.coerce.number().positive("El monto debe ser mayor a 0"),
  periodo: z.string().max(50).optional().or(z.literal("")),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin: z.string().min(1, "La fecha de fin es requerida"),
  estado: z.enum(estadoPresupuestoValues),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
});

export const configuracionComisionSchema = z.object({
  empleado_id: z.string().uuid("Debe seleccionar un empleado"),
  tipo_comision: z.enum(tipoComisionValues, { required_error: "Debe seleccionar un tipo" }),
  porcentaje_base: z.coerce.number().min(0).max(100),
  escalonamiento: z.record(z.unknown()).optional(),
});

export const entidadBancariaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  sucursal_banco: z.string().max(200).optional().or(z.literal("")),
  numero_cuenta: z.string().max(50).optional().or(z.literal("")),
  cbu: z.string().max(30).optional().or(z.literal("")),
  alias: z.string().max(100).optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
});

export type CajaInput = z.infer<typeof cajaSchema>;
export type MovimientoInput = z.infer<typeof movimientoSchema>;
export type ArqueoInput = z.infer<typeof arqueoSchema>;
export type ChequeInput = z.infer<typeof chequeSchema>;
export type TransicionChequeInput = z.infer<typeof transicionChequeSchema>;
export type GastoInput = z.infer<typeof gastoSchema>;
export type GastoRecurrenteInput = z.infer<typeof gastoRecurrenteSchema>;
export type MetodoPagoInput = z.infer<typeof metodoPagoSchema>;
export type PresupuestoInput = z.infer<typeof presupuestoSchema>;
export type ConfiguracionComisionInput = z.infer<typeof configuracionComisionSchema>;
export type EntidadBancariaInput = z.infer<typeof entidadBancariaSchema>;

// Invoice schemas

export const tipoComprobanteValues = ["FACTURA", "NOTA_CREDITO", "NOTA_DEBITO"] as const;
export const letraComprobanteValues = ["A", "B", "C", "N", "X"] as const;

export const createFromPedidoSchema = z.object({
  pedido_id: z.string().uuid("Debe seleccionar un pedido"),
  letra: z.enum(letraComprobanteValues).optional(),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
});

export const comprobanteItemSchema = z.object({
  producto_id: z.string().uuid().optional().or(z.literal("")),
  nombre: z.string().min(1, "El nombre es requerido").max(300),
  codigo: z.string().max(50).optional().or(z.literal("")),
  unidad: z.string().min(1, "La unidad es requerida").max(20),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
});

export const createManualComprobanteSchema = z.object({
  tipo: z.enum(tipoComprobanteValues, { required_error: "Debe seleccionar un tipo" }),
  letra: z.enum(letraComprobanteValues, { required_error: "Debe seleccionar una letra" }),
  cliente_id: z.string().uuid("Debe seleccionar un cliente"),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  condicion_pago: z.enum(condicionPagoValues, {
    required_error: "Debe seleccionar una condición de pago",
  }),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(comprobanteItemSchema).min(1, "Debe agregar al menos un item"),
});

export type CreateFromPedidoInput = z.infer<typeof createFromPedidoSchema>;
export type ComprobanteItemInput = z.infer<typeof comprobanteItemSchema>;
export type CreateManualComprobanteInput = z.infer<typeof createManualComprobanteSchema>;

// Supplier schemas

export const proveedorSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  cuit: z.string().max(20).optional().or(z.literal("")),
  condicion_iva: z.enum(condicionIvaValues).optional().or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  direccion: z.string().max(500).optional().or(z.literal("")),
  contacto: z.string().max(200).optional().or(z.literal("")),
  banco: z.string().max(100).optional().or(z.literal("")),
  cbu: z.string().max(50).optional().or(z.literal("")),
  alias: z.string().max(50).optional().or(z.literal("")),
  notas: z.string().max(2000).optional().or(z.literal("")),
});

export type ProveedorInput = z.infer<typeof proveedorSchema>;

// Purchase Order schemas

export const ordenCompraItemSchema = z.object({
  producto_id: z.string().uuid("Debe seleccionar un producto"),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
});

export const ordenCompraImpuestoSchema = z.object({
  tipo: z.enum(tipoImpuestoValues, { required_error: "Seleccione un tipo" }),
  nombre: z.string().min(1, "El nombre es requerido").max(100),
  porcentaje: z.coerce.number().min(0, "El porcentaje debe ser mayor o igual a 0"),
});

export const ordenCompraSchema = z.object({
  proveedor_id: z.string().uuid("Debe seleccionar un proveedor"),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  condicion_pago: z.enum(condicionPagoValues, {
    required_error: "Debe seleccionar una condición de pago",
  }),
  fecha_entrega_estimada: z.string().optional().or(z.literal("")),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(ordenCompraItemSchema).min(1, "Debe agregar al menos un producto"),
  impuestos: z.array(ordenCompraImpuestoSchema),
});

export const receiveItemSchema = z.object({
  detalle_id: z.string().uuid(),
  cantidad_recibida: z.coerce.number().min(0, "La cantidad debe ser mayor o igual a 0"),
});

export const receiveSchema = z.object({
  items: z.array(receiveItemSchema).min(1, "Debe indicar al menos un producto"),
});

export type OrdenCompraItemInput = z.infer<typeof ordenCompraItemSchema>;
export type OrdenCompraImpuestoInput = z.infer<typeof ordenCompraImpuestoSchema>;
export type OrdenCompraInput = z.infer<typeof ordenCompraSchema>;
export type ReceiveItemInput = z.infer<typeof receiveItemSchema>;
export type ReceiveInput = z.infer<typeof receiveSchema>;

// Stock adjustment
export const ajusteStockSchema = z.object({
  producto_id: z.string().uuid("Debe seleccionar un producto"),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  cantidad: z.coerce.number().int("Debe ser un número entero").refine((n) => n !== 0, "La cantidad no puede ser 0"),
  tipo: z.enum(["AJUSTE", "QUIEBRE", "DEVOLUCION"], {
    required_error: "Debe seleccionar un tipo",
  }),
  motivo: z.string().min(3, "Debe indicar un motivo").max(500),
});
export type AjusteStockInput = z.infer<typeof ajusteStockSchema>;

// Transfers
export const transferenciaSchema = z.object({
  sucursal_origen_id: z.string().uuid("Debe seleccionar sucursal de origen"),
  sucursal_destino_id: z.string().uuid("Debe seleccionar sucursal de destino"),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
  items: z.array(z.object({
    producto_id: z.string().uuid(),
    producto_nombre: z.string(),
    producto_codigo: z.string().optional().or(z.literal("")),
    cantidad_solicitada: z.coerce.number().int().min(1, "Mínimo 1 unidad"),
  })).min(1, "Debe agregar al menos un producto"),
});
export type TransferenciaInput = z.infer<typeof transferenciaSchema>;

export const transicionTransferenciaSchema = z.object({
  estado: z.enum(["APROBADA", "EN_TRANSITO", "COMPLETADA", "CANCELADA"], {
    required_error: "Debe seleccionar un estado",
  }),
  observaciones: z.string().max(500).optional().or(z.literal("")),
  items: z.array(z.object({
    id: z.string().uuid(),
    cantidad_enviada: z.coerce.number().int().min(0).optional(),
    cantidad_recibida: z.coerce.number().int().min(0).optional(),
  })).optional(),
});
export type TransicionTransferenciaInput = z.infer<typeof transicionTransferenciaSchema>;

// Vehicles
export const vehiculoSchema = z.object({
  marca: z.string().min(1, "La marca es requerida").max(100),
  modelo: z.string().min(1, "El modelo es requerido").max(100),
  patente: z.string().min(1, "La patente es requerida").max(20),
  anio: z.coerce.number().int().min(1900).max(2100).optional().or(z.literal(0)),
  capacidad_kg: z.coerce.number().min(0).optional().or(z.literal(0)),
  capacidad_volumen: z.coerce.number().min(0).optional().or(z.literal(0)),
  sucursal_id: z.string().uuid().optional().or(z.literal("")),
});
export type VehiculoInput = z.infer<typeof vehiculoSchema>;

// Zones
export const zonaSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  descripcion: z.string().max(1000).optional().or(z.literal("")),
  sucursal_id: z.string().uuid().optional().or(z.literal("")),
});
export type ZonaInput = z.infer<typeof zonaSchema>;

// Deliveries
export const repartoSchema = z.object({
  fecha: z.string().min(1, "La fecha es requerida"),
  empleado_id: z.string().uuid("Debe seleccionar un repartidor"),
  vehiculo_id: z.string().uuid().optional().or(z.literal("")),
  zona_id: z.string().uuid().optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
  pedido_ids: z.array(z.string().uuid()).min(1, "Debe asignar al menos un pedido"),
});
export type RepartoInput = z.infer<typeof repartoSchema>;

export const transicionRepartoSchema = z.object({
  estado: z.enum(["EN_CURSO", "FINALIZADO", "CANCELADO"], {
    required_error: "Debe seleccionar un estado",
  }),
  km_inicio: z.coerce.number().min(0).optional(),
  km_fin: z.coerce.number().min(0).optional(),
});
export type TransicionRepartoInput = z.infer<typeof transicionRepartoSchema>;

export const eventoRepartoSchema = z.object({
  pedido_id: z.string().uuid().optional().or(z.literal("")),
  tipo: z.enum(["LLEGADA", "ENTREGA", "NO_ENTREGA", "ENTREGA_PARCIAL", "COBRO"], {
    required_error: "Debe seleccionar un tipo de evento",
  }),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  comentario: z.string().max(1000).optional().or(z.literal("")),
  monto_cobrado: z.coerce.number().min(0).optional(),
  firma_url: z.string().optional().or(z.literal("")),
});
export type EventoRepartoInput = z.infer<typeof eventoRepartoSchema>;

// Branch schemas
export const sucursalSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  direccion: z.string().max(500).optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
});
export type SucursalInput = z.infer<typeof sucursalSchema>;

// AFIP schemas
export const afipConfigSchema = z.object({
  cuit: z.string().min(11, "CUIT inválido").max(20),
  punto_venta: z.coerce.number().int().min(1, "Punto de venta inválido").max(99999),
  modo: z.enum(["TESTING", "PRODUCCION"], { required_error: "Debe seleccionar un modo" }),
  activo: z.boolean(),
});
export type AfipConfigInput = z.infer<typeof afipConfigSchema>;

// Retenciones schemas
export const retencionSchema = z.object({
  tipo: z.enum(["IIBB", "GANANCIAS", "IVA", "SUSS"]),
  entidad_tipo: z.enum(["CLIENTE", "PROVEEDOR"]),
  entidad_id: z.string().uuid(),
  pago_id: z.string().uuid().optional().or(z.literal("")),
  numero_certificado: z.string().max(50).optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es requerida"),
  base_imponible: z.coerce.number().positive(),
  alicuota: z.coerce.number().min(0),
  monto: z.coerce.number().positive(),
  periodo: z.string().max(7).optional().or(z.literal("")),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
});
export type RetencionInput = z.infer<typeof retencionSchema>;

// Devolucion schemas
export const detalleDevolucionItemSchema = z.object({
  producto_id: z.string().uuid(),
  cantidad: z.coerce.number().int().positive(),
  motivo_item: z.string().max(300).optional().or(z.literal("")),
});

export const devolucionSchema = z.object({
  pedido_id: z.string().uuid().optional().or(z.literal("")),
  cliente_id: z.string().uuid("Debe seleccionar un cliente"),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  motivo: z.string().min(5, "El motivo debe tener al menos 5 caracteres").max(500),
  fecha: z.string().min(1, "La fecha es requerida"),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  items: z.array(detalleDevolucionItemSchema).min(1, "Debe agregar al menos un producto"),
});

export type DetalleDevolucionItemInput = z.infer<typeof detalleDevolucionItemSchema>;
export type DevolucionInput = z.infer<typeof devolucionSchema>;

// Supplier Invoice (Factura de Proveedor) schemas
export const tipoFacturaProveedorValues = [
  "FACTURA_A",
  "FACTURA_B",
  "FACTURA_C",
  "NOTA_CREDITO",
  "NOTA_DEBITO",
] as const;

export const detalleFacturaProveedorItemSchema = z.object({
  producto_id: z.string().optional().or(z.literal("")),
  descripcion: z.string().min(1, "La descripcion es requerida").max(300),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
  precio_unitario: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
});

export const facturaProveedorSchema = z.object({
  numero: z.string().min(1, "El numero de factura es requerido").max(50),
  proveedor_id: z.string().uuid("Debe seleccionar un proveedor"),
  orden_compra_id: z.string().uuid().optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  tipo: z.enum(tipoFacturaProveedorValues, {
    required_error: "Debe seleccionar un tipo",
  }),
  fecha_emision: z.string().min(1, "La fecha de emision es requerida"),
  fecha_vencimiento: z.string().optional().or(z.literal("")),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  items: z
    .array(detalleFacturaProveedorItemSchema)
    .min(1, "Debe agregar al menos un item"),
});

export type DetalleFacturaProveedorItemInput = z.infer<
  typeof detalleFacturaProveedorItemSchema
>;
export type FacturaProveedorInput = z.infer<typeof facturaProveedorSchema>;

// Supplier Return (Devolucion a Proveedor) schemas
export const detalleDevolucionProveedorItemSchema = z.object({
  producto_id: z.string().uuid("Debe seleccionar un producto"),
  cantidad: z.coerce.number().int().positive("La cantidad debe ser mayor a 0"),
  motivo_item: z.string().max(300).optional().or(z.literal("")),
});

export const devolucionProveedorSchema = z.object({
  proveedor_id: z.string().uuid("Debe seleccionar un proveedor"),
  orden_compra_id: z.string().uuid().optional().or(z.literal("")),
  sucursal_id: z.string().uuid("Debe seleccionar una sucursal"),
  motivo: z
    .string()
    .min(5, "El motivo debe tener al menos 5 caracteres")
    .max(500),
  fecha: z.string().min(1, "La fecha es requerida"),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  items: z
    .array(detalleDevolucionProveedorItemSchema)
    .min(1, "Debe agregar al menos un producto"),
});

export type DetalleDevolucionProveedorItemInput = z.infer<
  typeof detalleDevolucionProveedorItemSchema
>;
export type DevolucionProveedorInput = z.infer<
  typeof devolucionProveedorSchema
>;

// Salida Vendedor schemas
export const registrarSalidaSchema = z.object({
  empleado_id: z.string().uuid(),
  sucursal_id: z.string().uuid(),
  km_inicio: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
});
export type RegistrarSalidaInput = z.infer<typeof registrarSalidaSchema>;

export const registrarRegresoSchema = z.object({
  km_fin: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(1000).optional().or(z.literal("")),
});
export type RegistrarRegresoInput = z.infer<typeof registrarRegresoSchema>;

// Visita Cliente schemas
export const visitaClienteSchema = z.object({
  vendedor_id: z.string().uuid("Debe seleccionar un vendedor"),
  cliente_id: z.string().uuid("Debe seleccionar un cliente"),
  direccion_id: z.string().uuid().optional().or(z.literal("")),
  fecha: z.string().min(1, "La fecha es requerida"),
  hora_inicio: z.string().optional().or(z.literal("")),
  resultado: z.enum(["PENDIENTE", "REALIZADA", "NO_ATENDIDO", "REPROGRAMADA", "CANCELADA"]).default("PENDIENTE"),
  latitud: z.coerce.number().optional(),
  longitud: z.coerce.number().optional(),
  notas: z.string().max(2000).optional().or(z.literal("")),
});
export type VisitaClienteInput = z.infer<typeof visitaClienteSchema>;

// Loyalty Program schemas
export const programaFidelidadSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(200),
  puntos_por_peso: z.coerce.number().positive("Debe ser mayor a 0"),
  valor_punto: z.coerce.number().positive("Debe ser mayor a 0"),
  minimo_canje: z.coerce.number().int().positive("Debe ser mayor a 0"),
  activo: z.boolean(),
});
export type ProgramaFidelidadInput = z.infer<typeof programaFidelidadSchema>;

export const acumularPuntosSchema = z.object({
  puntos: z.coerce.number().int().positive("Los puntos deben ser mayor a 0"),
  referencia_id: z.string().uuid().optional().or(z.literal("")),
  referencia_tipo: z.string().max(30).optional().or(z.literal("")),
  descripcion: z.string().max(300).optional().or(z.literal("")),
});
export type AcumularPuntosInput = z.infer<typeof acumularPuntosSchema>;

export const canjearPuntosSchema = z.object({
  puntos: z.coerce.number().int().positive("Los puntos deben ser mayor a 0"),
  descripcion: z.string().max(300).optional().or(z.literal("")),
});
export type CanjearPuntosInput = z.infer<typeof canjearPuntosSchema>;

// Categoria Cliente schemas
export const categoriaClienteSchema = z.object({
  nombre: z.string().min(2).max(200),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  descuento_porcentaje: z.coerce.number().min(0).max(100),
});
export type CategoriaClienteInput = z.infer<typeof categoriaClienteSchema>;

// Configuracion Empresa schemas
export const configuracionEmpresaSchema = z.object({
  razon_social: z.string().min(2).max(300),
  cuit: z.string().max(20).optional().or(z.literal("")),
  condicion_iva: z.string().optional().or(z.literal("")),
  direccion: z.string().max(500).optional().or(z.literal("")),
  telefono: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email().optional().or(z.literal("")),
  logo_url: z.string().max(500).optional().or(z.literal("")),
  pie_factura: z.string().max(1000).optional().or(z.literal("")),
});
export type ConfiguracionEmpresaInput = z.infer<typeof configuracionEmpresaSchema>;

// Conversion schemas
export const conversionSchema = z.object({
  from_unit: z.enum(["KG", "UNIDAD", "LITRO", "METRO", "CAJA", "BOLSA", "PACK"]),
  to_unit: z.enum(["KG", "UNIDAD", "LITRO", "METRO", "CAJA", "BOLSA", "PACK"]),
  factor: z.coerce.number().positive(),
});
export type ConversionInput = z.infer<typeof conversionSchema>;

// Extracto bancario schemas
export const extractoSchema = z.object({
  entidad_bancaria_id: z.string().uuid(),
  fecha_desde: z.string().min(1),
  fecha_hasta: z.string().min(1),
  archivo_nombre: z.string().max(300).optional().or(z.literal("")),
});
export type ExtractoInput = z.infer<typeof extractoSchema>;

// Mantenimiento vehiculo schemas
export const mantenimientoVehiculoSchema = z.object({
  vehiculo_id: z.string().uuid(),
  tipo: z.string().min(2).max(100),
  descripcion: z.string().max(500).optional().or(z.literal("")),
  fecha: z.string().min(1),
  proximo_fecha: z.string().optional().or(z.literal("")),
  proximo_km: z.coerce.number().int().min(0).optional(),
  costo: z.coerce.number().min(0).optional(),
  proveedor: z.string().max(200).optional().or(z.literal("")),
  numero_factura: z.string().max(100).optional().or(z.literal("")),
});
export type MantenimientoVehiculoInput = z.infer<typeof mantenimientoVehiculoSchema>;

// Meta de venta schemas
export const tipoMetaValues = ["MONTO", "CANTIDAD", "CLIENTES_NUEVOS", "EMPLEADO", "SUCURSAL"] as const;
export const metaVentaSchema = z.object({
  nombre: z.string().min(2).max(200),
  tipo: z.enum(tipoMetaValues),
  empleado_id: z.string().uuid().optional().or(z.literal("")),
  sucursal_id: z.string().uuid().optional().or(z.literal("")),
  monto_objetivo: z.coerce.number().positive(),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().min(1),
});
export type MetaVentaInput = z.infer<typeof metaVentaSchema>;

// Pagos schemas
export const tipoPagoValues = ["EFECTIVO", "TRANSFERENCIA", "CHEQUE", "TARJETA", "OTRO"] as const;
export const pagoSchema = z.object({
  cliente_id: z.string().uuid(),
  sucursal_id: z.string().uuid(),
  tipo: z.enum(tipoPagoValues),
  monto: z.coerce.number().positive(),
  fecha_pago: z.string().min(1),
  referencia: z.string().max(200).optional().or(z.literal("")),
  metodo_pago_id: z.string().uuid().optional().or(z.literal("")),
  caja_id: z.string().uuid().optional().or(z.literal("")),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  aplicaciones: z.array(z.object({
    comprobante_id: z.string().uuid(),
    monto_aplicado: z.coerce.number().positive(),
  })).optional(),
});
export type PagoInput = z.infer<typeof pagoSchema>;

// Pago proveedor schemas
export const pagoProveedorSchema = z.object({
  proveedor_id: z.string().uuid(),
  sucursal_id: z.string().uuid(),
  tipo: z.enum(tipoPagoValues),
  monto: z.coerce.number().positive(),
  fecha_pago: z.string().min(1),
  referencia: z.string().max(200).optional().or(z.literal("")),
  metodo_pago_id: z.string().uuid().optional().or(z.literal("")),
  caja_id: z.string().uuid().optional().or(z.literal("")),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
  aplicaciones: z.array(z.object({
    orden_compra_id: z.string().uuid(),
    monto_aplicado: z.coerce.number().positive(),
  })).optional(),
});
export type PagoProveedorInput = z.infer<typeof pagoProveedorSchema>;

// Plantilla pedido schemas
export const plantillaPedidoSchema = z.object({
  nombre: z.string().min(2).max(200),
  cliente_id: z.string().uuid(),
  sucursal_id: z.string().uuid(),
  frecuencia_dias: z.coerce.number().int().positive(),
  proximo_generacion: z.string().optional().or(z.literal("")),
  activa: z.boolean(),
  items: z.array(z.object({
    producto_id: z.string().uuid(),
    cantidad: z.coerce.number().positive(),
    precio: z.coerce.number().min(0),
  })).min(1),
});
export type PlantillaPedidoInput = z.infer<typeof plantillaPedidoSchema>;

// Promocion schemas
export const promocionSchema = z.object({
  nombre: z.string().min(2).max(200),
  tipo: z.enum(["PORCENTAJE", "MONTO_FIJO", "2X1", "NXM"]),
  valor: z.coerce.number().min(0),
  cantidad_minima: z.coerce.number().int().min(0).optional(),
  producto_id: z.string().uuid().optional().or(z.literal("")),
  categoria_id: z.string().uuid().optional().or(z.literal("")),
  fecha_inicio: z.string().min(1),
  fecha_fin: z.string().min(1),
  activa: z.boolean(),
  sucursal_id: z.string().uuid().optional().or(z.literal("")),
});
export type PromocionInput = z.infer<typeof promocionSchema>;

// Remito from pedido schemas
export const remitoFromPedidoSchema = z.object({
  pedido_id: z.string().uuid(),
  transportista: z.string().max(200).optional().or(z.literal("")),
  patente: z.string().max(20).optional().or(z.literal("")),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
});
export type RemitoFromPedidoInput = z.infer<typeof remitoFromPedidoSchema>;

// Task schemas
export const taskSchema = z.object({
  titulo: z.string().min(2).max(200),
  descripcion: z.string().max(2000).optional().or(z.literal("")),
  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "URGENTE"]),
  estado: z.enum(["PENDIENTE", "EN_PROGRESO", "COMPLETADA", "CANCELADA"]),
  asignado_a: z.string().uuid().optional().or(z.literal("")),
  fecha_limite: z.string().optional().or(z.literal("")),
});
export type TaskInput = z.infer<typeof taskSchema>;

export const taskCommentSchema = z.object({
  contenido: z.string().min(1).max(2000),
});
export type TaskCommentInput = z.infer<typeof taskCommentSchema>;

// Contrato (Employee Contract) schemas
export const contratoSchema = z.object({
  tipo: z.enum(["RELACION_DEPENDENCIA", "MONOTRIBUTO", "EVENTUAL"]),
  fecha_inicio: z.string().min(1, "La fecha de inicio es requerida"),
  fecha_fin: z.string().optional().or(z.literal("")),
  salario: z.coerce.number().min(0).optional(),
  observaciones: z.string().max(2000).optional().or(z.literal("")),
});
export type ContratoInput = z.infer<typeof contratoSchema>;

// Evaluacion Proveedor schemas
export const evaluacionProveedorSchema = z.object({
  proveedor_id: z.string().uuid("Debe seleccionar un proveedor"),
  calidad: z.coerce.number().min(1).max(5),
  puntualidad: z.coerce.number().min(1).max(5),
  precio: z.coerce.number().min(1).max(5),
  comunicacion: z.coerce.number().min(1).max(5),
  comentario: z.string().max(2000).optional().or(z.literal("")),
});
export type EvaluacionProveedorInput = z.infer<typeof evaluacionProveedorSchema>;

// Limite de Credito schemas
export const limiteCreditoSchema = z.object({
  limite_credito: z.coerce.number().min(0),
});
export type LimiteCreditoInput = z.infer<typeof limiteCreditoSchema>;

// Variante de Producto schemas
export const varianteSchema = z.object({
  producto_id: z.string().uuid(),
  nombre: z.string().min(1).max(100),
});
export type VarianteInput = z.infer<typeof varianteSchema>;

export const opcionVarianteSchema = z.object({
  variante_id: z.string().uuid().optional().or(z.literal("")),
  valor: z.string().min(1).max(100),
  orden: z.coerce.number().int().min(0).optional(),
});
export type OpcionVarianteInput = z.infer<typeof opcionVarianteSchema>;

export const skuVarianteSchema = z.object({
  producto_id: z.string().uuid(),
  sku: z.string().min(1).max(50),
  precio: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).optional(),
  precio_adicional: z.coerce.number().min(0).optional(),
  stock_adicional: z.coerce.number().int().min(0).optional(),
  opciones: z.record(z.string()).optional(),
  opciones_ids: z.array(z.string()).optional(),
  activo: z.boolean().optional(),
});
export type SKUVarianteInput = z.infer<typeof skuVarianteSchema>;

// Importar Movimientos Bancarios schemas
export const importarMovimientosSchema = z.object({
  movimientos: z.array(z.object({
    fecha: z.string().min(1),
    descripcion: z.string().min(1),
    monto: z.coerce.number(),
    referencia: z.string().max(200).optional().or(z.literal("")),
    tipo: z.enum(["DEBITO", "CREDITO"]).optional(),
  })).min(1),
});
export type ImportarMovimientosInput = z.infer<typeof importarMovimientosSchema>;

// Conciliar movimiento bancario schemas
export const conciliarSchema = z.object({
  movimiento_caja_id: z.string().uuid(),
});
export type ConciliarInput = z.infer<typeof conciliarSchema>;
