export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: Meta;
  error?: ApiError;
}

export interface Meta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "error";
  version: string;
  timestamp: string;
}

export interface BranchInfo {
  id: string;
  nombre: string;
  direccion?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
  permissions: string[];
  email_verified: boolean;
  sucursales: BranchInfo[];
  sucursal_actual?: BranchInfo;
}

export interface FamiliaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
}

export interface CategoriaProducto {
  id: string;
  nombre: string;
  descripcion?: string;
  familia_id: string;
}

export interface Producto {
  id: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  precio_base: number;
  unidad: string;
  categoria_id?: string;
  categoria_nombre?: string;
  familia_nombre?: string;
}

export interface CatalogoProducto {
  id: string;
  producto_id: string;
  sucursal_id: string;
  precio: number;
  stock: number;
  producto_nombre?: string;
  producto_codigo?: string;
  producto_unidad?: string;
  producto_precio_base?: number;
}

export interface Cliente {
  id: string;
  nombre: string;
  apellido?: string;
  razon_social?: string;
  cuit?: string;
  condicion_iva: string;
  email?: string;
  telefono?: string;
  reputacion: string;
}

export interface Direccion {
  id: string;
  cliente_id: string;
  calle: string;
  numero?: string;
  piso?: string;
  departamento?: string;
  ciudad?: string;
  provincia?: string;
  codigo_postal?: string;
  latitud?: number;
  longitud?: number;
  principal: boolean;
}

// Employees

export interface Empleado {
  id: string;
  nombre: string;
  apellido: string;
  email?: string;
  cuil?: string;
  access_code?: string;
  rol: string;
  sucursal_id: string;
  created_at: string;
  // HR fields
  telefono?: string;
  fecha_ingreso?: string;
  fecha_egreso?: string;
  estado: string;
  dni?: string;
  direccion?: string;
  salario_base?: number;
  observaciones?: string;
  tipo_contrato: string;
  obra_social?: string;
  numero_legajo?: string;
  banco?: string;
  cbu?: string;
}

export interface EmpleadoBranch {
  id: string;
  nombre: string;
  direccion?: string;
}

// Orders

export interface PedidoList {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  estado: string;
  condicion_pago: string;
  fecha_pedido: string;
  fecha_entrega_estimada?: string;
  subtotal: number;
  total: number;
}

export interface PedidoDetail {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nombre: string;
  cliente_apellido?: string;
  cliente_cuit?: string;
  direccion_id?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  empleado_id?: string;
  empleado_nombre?: string;
  estado: string;
  condicion_pago: string;
  fecha_pedido: string;
  fecha_entrega_estimada?: string;
  fecha_entrega_real?: string;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  base_imponible: number;
  total_impuestos: number;
  total: number;
  observaciones?: string;
  observaciones_internas?: string;
  items: DetallePedido[];
  impuestos: ImpuestoPedido[];
  historial: HistorialPedido[];
}

export interface DetallePedido {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  producto_unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  subtotal: number;
  cantidad_entregada: number;
  orden: number;
}

export interface ImpuestoPedido {
  id: string;
  tipo: string;
  nombre: string;
  porcentaje: number;
  base_imponible: number;
  monto: number;
}

export interface HistorialPedido {
  id: string;
  estado_anterior?: string;
  estado_nuevo: string;
  empleado_id?: string;
  empleado_nombre?: string;
  comentario?: string;
  created_at: string;
}

export interface ConfiguracionImpuesto {
  id: string;
  nombre: string;
  tipo: string;
  porcentaje: number;
  aplicar_por_defecto: boolean;
}

// Invoices

export interface ComprobanteList {
  id: string;
  tipo: string;
  letra: string;
  numero: string;
  estado: string;
  afip_estado?: string;
  cliente_nombre: string;
  total: number;
  fecha_emision: string;
}

export interface ComprobanteDetail {
  id: string;
  tipo: string;
  letra: string;
  numero: string;
  estado: string;
  pedido_id?: string;
  cliente_id: string;
  cliente_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  subtotal: number;
  descuento_monto: number;
  base_imponible: number;
  total_impuestos: number;
  total: number;
  impuestos: ImpuestoSnapshot[];
  afip_estado?: string;
  cae?: string;
  fecha_vencimiento_cae?: string;
  fecha_emision: string;
  condicion_pago: string;
  observaciones?: string;
  items: DetalleComprobante[];
  created_at: string;
}

export interface DetalleComprobante {
  id: string;
  producto_id?: string;
  producto_nombre: string;
  producto_codigo?: string;
  producto_unidad: string;
  cantidad: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  subtotal: number;
  orden: number;
}

export interface ImpuestoSnapshot {
  tipo: string;
  nombre: string;
  porcentaje: number;
  base_imponible: number;
  monto: number;
}

// Finance

export interface Caja {
  id: string;
  nombre: string;
  sucursal_id: string;
  tipo: string;
  saldo: number;
  created_at: string;
}

export interface MovimientoCaja {
  id: string;
  caja_id: string;
  tipo: string;
  monto: number;
  concepto: string;
  referencia_id?: string;
  referencia_tipo?: string;
  created_at: string;
}

export interface ArqueoCaja {
  id: string;
  caja_id: string;
  monto_sistema: number;
  monto_fisico: number;
  diferencia: number;
  estado: string;
  observaciones?: string;
  desglose?: Record<string, unknown>;
  created_at: string;
}

export interface EntidadBancaria {
  id: string;
  nombre: string;
  sucursal_banco?: string;
  numero_cuenta?: string;
  cbu?: string;
  alias?: string;
  sucursal_id: string;
}

export interface Cheque {
  id: string;
  numero: string;
  monto: number;
  fecha_emision: string;
  fecha_vencimiento: string;
  estado: string;
  banco?: string;
  emisor?: string;
  receptor?: string;
  entidad_bancaria_id?: string;
  sucursal_id: string;
}

export interface MetodoPago {
  id: string;
  nombre: string;
  tipo: string;
  comision_porcentaje: number;
  descuento_porcentaje: number;
  sucursal_id: string;
}

export interface Gasto {
  id: string;
  concepto: string;
  monto: number;
  categoria: string;
  fecha: string;
  comprobante?: string;
  sucursal_id: string;
}

export interface GastoRecurrente {
  id: string;
  concepto: string;
  monto: number;
  categoria: string;
  frecuencia: string;
  proxima_fecha: string;
  sucursal_id: string;
}

export interface Presupuesto {
  id: string;
  nombre: string;
  monto_asignado: number;
  monto_utilizado: number;
  periodo?: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
  sucursal_id: string;
}

export interface ConfiguracionComision {
  id: string;
  empleado_id: string;
  tipo_comision: string;
  porcentaje_base: number;
  escalonamiento?: Record<string, unknown>;
}

export interface ComisionVendedor {
  id: string;
  empleado_id: string;
  pedido_id?: string;
  monto: number;
  porcentaje: number;
  periodo?: string;
  created_at: string;
}

export interface MovimientoResumen {
  id: string;
  tipo: string;
  monto: number;
  concepto: string;
  created_at: string;
  caja_nombre: string;
}

export interface ChequeResumen {
  id: string;
  numero: string;
  monto: number;
  fecha_vencimiento: string;
  estado: string;
  banco?: string;
  emisor?: string;
}

export interface FinanceResumen {
  total_ingresos: number;
  total_egresos: number;
  saldo_cajas: number;
  total_cheques_pendientes: number;
  total_gastos_mes: number;
  ultimos_movimientos: MovimientoResumen[];
  cheques_por_vencer: ChequeResumen[];
}

// Dashboard

export interface DashboardKPIs {
  pedidos_hoy: number;
  productos_activos: number;
  clientes_activos: number;
  facturacion_mes: number;
}

export interface MonthlyAmount {
  month: string;
  total: number;
}

export interface StatusCount {
  estado: string;
  count: number;
}

export interface DailyCount {
  day: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  estado_anterior?: string;
  estado_nuevo: string;
  comentario?: string;
  created_at: string;
  pedido_numero: string;
  cliente_nombre: string;
  empleado_nombre?: string;
}

export interface DashboardStats {
  kpis: DashboardKPIs;
  revenue_chart: MonthlyAmount[];
  expenses_chart: MonthlyAmount[];
  orders_by_status: StatusCount[];
  weekly_orders: DailyCount[];
  recent_activity: ActivityItem[];
}

// Suppliers

export interface Proveedor {
  id: string;
  nombre: string;
  cuit?: string;
  condicion_iva?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  contacto?: string;
  banco?: string;
  cbu?: string;
  alias?: string;
  notas?: string;
  created_at: string;
  updated_at: string;
}

// Purchase Orders

export interface OrdenCompraList {
  id: string;
  numero: string;
  proveedor_id: string;
  proveedor_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  estado: string;
  condicion_pago: string;
  fecha_orden: string;
  fecha_entrega_estimada?: string;
  subtotal: number;
  total: number;
  created_at: string;
}

export interface OrdenCompraDetail {
  id: string;
  numero: string;
  proveedor_id: string;
  proveedor_nombre: string;
  proveedor_cuit?: string;
  proveedor_condicion_iva?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  estado: string;
  condicion_pago: string;
  fecha_orden: string;
  fecha_entrega_estimada?: string;
  subtotal: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  base_imponible: number;
  total_impuestos: number;
  total: number;
  observaciones?: string;
  items: DetalleOrdenCompra[];
  impuestos: ImpuestoOrdenCompra[];
  historial: HistorialOrdenCompra[];
}

export interface DetalleOrdenCompra {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  producto_unidad: string;
  cantidad: number;
  cantidad_recibida: number;
  precio_unitario: number;
  descuento_porcentaje: number;
  descuento_monto: number;
  subtotal: number;
  orden: number;
}

export interface ImpuestoOrdenCompra {
  id: string;
  tipo: string;
  nombre: string;
  porcentaje: number;
  base_imponible: number;
  monto: number;
}

export interface HistorialOrdenCompra {
  id: string;
  estado_anterior?: string;
  estado_nuevo: string;
  empleado_id?: string;
  empleado_nombre?: string;
  comentario?: string;
  created_at: string;
}

// Stock Movements
export interface MovimientoStock {
  id: string;
  producto_id: string;
  producto_nombre?: string;
  producto_codigo?: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  motivo?: string;
  referencia_id?: string;
  referencia_tipo?: string;
  empleado_id?: string;
  empleado_nombre?: string;
  created_at: string;
}

// Transfers
export interface TransferenciaList {
  id: string;
  numero: string;
  sucursal_origen_id: string;
  sucursal_origen_nombre: string;
  sucursal_destino_id: string;
  sucursal_destino_nombre: string;
  estado: string;
  fecha_solicitud: string;
  items_count: number;
}

export interface TransferenciaDetail {
  id: string;
  numero: string;
  sucursal_origen_id: string;
  sucursal_origen_nombre: string;
  sucursal_destino_id: string;
  sucursal_destino_nombre: string;
  estado: string;
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  fecha_envio?: string;
  fecha_recepcion?: string;
  observaciones?: string;
  solicitado_por_nombre?: string;
  aprobado_por_nombre?: string;
  items: ItemTransferencia[];
}

export interface ItemTransferencia {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  cantidad_solicitada: number;
  cantidad_enviada: number;
  cantidad_recibida: number;
}

// Vehicles
export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  patente: string;
  anio?: number;
  capacidad_kg?: number;
  capacidad_volumen?: number;
  sucursal_id?: string;
  sucursal_nombre?: string;
}

// Zones
export interface Zona {
  id: string;
  nombre: string;
  descripcion?: string;
  sucursal_id?: string;
  sucursal_nombre?: string;
}

// Deliveries
export interface RepartoList {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  empleado_id: string;
  empleado_nombre: string;
  vehiculo_patente?: string;
  zona_nombre?: string;
  sucursal_nombre: string;
  pedidos_count: number;
}

export interface RepartoDetail {
  id: string;
  numero: string;
  fecha: string;
  estado: string;
  empleado_id: string;
  empleado_nombre: string;
  vehiculo_id?: string;
  vehiculo_patente?: string;
  vehiculo_descripcion?: string;
  zona_id?: string;
  zona_nombre?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  hora_salida?: string;
  hora_regreso?: string;
  km_inicio?: number;
  km_fin?: number;
  observaciones?: string;
  pedidos: RepartoPedido[];
  eventos: EventoReparto[];
}

export interface RepartoPedido {
  id: string;
  pedido_id: string;
  pedido_numero: string;
  cliente_nombre: string;
  pedido_estado: string;
  pedido_total: number;
  orden: number;
}

// Branches (Settings)
export interface Branch {
  id: string;
  nombre: string;
  direccion?: string;
  telefono?: string;
}

// Reports
export interface SalesReport {
  by_period: ReportPeriodItem[];
  by_client: ReportGroupItem[];
  by_product: ReportGroupItem[];
  by_employee: ReportGroupItem[];
}

export interface PurchasesReport {
  by_period: ReportPeriodItem[];
  by_supplier: ReportGroupItem[];
}

export interface InventoryReport {
  stock_valuation: StockValuationItem[];
  movements_summary: ReportGroupItem[];
  low_stock: LowStockItem[];
}

export interface FinanceReport {
  income_vs_expenses: IncomeExpenseItem[];
  expense_breakdown: ReportGroupItem[];
}

export interface ProductReport {
  top_sellers: ReportGroupItem[];
}

export interface ReportPeriodItem {
  month: string;
  total: number;
  count: number;
}

export interface ReportGroupItem {
  label: string;
  value: number;
  count: number;
}

export interface StockValuationItem {
  producto_nombre: string;
  producto_codigo?: string;
  sucursal_nombre: string;
  stock: number;
  precio: number;
  valor_total: number;
}

export interface LowStockItem {
  producto_nombre: string;
  producto_codigo?: string;
  sucursal_nombre: string;
  stock: number;
  stock_minimo: number;
}

export interface IncomeExpenseItem {
  month: string;
  ingresos: number;
  gastos: number;
}

// AFIP
export interface AfipConfig {
  id: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  cuit: string;
  punto_venta: number;
  modo: "TESTING" | "PRODUCCION";
  activo: boolean;
  tiene_certificado: boolean;
}

export interface AfipAuthResult {
  success: boolean;
  message: string;
  ultimo_comprobante?: number;
}

export type AfipEstado = "NO_APLICA" | "PENDIENTE" | "AUTORIZADO" | "RECHAZADO";

export interface EventoReparto {
  id: string;
  reparto_id: string;
  pedido_id?: string;
  pedido_numero?: string;
  tipo: string;
  latitud?: number;
  longitud?: number;
  comentario?: string;
  monto_cobrado?: number;
  empleado_nombre?: string;
  created_at: string;
}
