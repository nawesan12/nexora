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
  tipo?: string;
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
  alicuota_iva?: string;
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
  tipo?: string;
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

export interface BranchRevenueReport {
  items: BranchRevenueItem[];
}

export interface BranchRevenueItem {
  sucursal_id: string;
  sucursal_nombre: string;
  sucursal_tipo: string;
  ingresos: number;
  gastos: number;
  neto: number;
  pedidos: number;
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
  firma_url?: string;
  empleado_nombre?: string;
  created_at: string;
}

// Retenciones
export interface Retencion {
  id: string;
  tipo: string;
  entidad_tipo: string;
  entidad_id: string;
  entidad_nombre: string;
  pago_id?: string;
  numero_certificado?: string;
  fecha: string;
  base_imponible: number;
  alicuota: number;
  monto: number;
  periodo?: string;
  estado: string;
  observaciones?: string;
  created_at: string;
}

// Devoluciones
export interface DevolucionList {
  id: string;
  numero: string;
  pedido_numero?: string;
  cliente_nombre: string;
  sucursal_nombre: string;
  motivo: string;
  estado: string;
  fecha: string;
  created_at: string;
}

export interface DevolucionDetail {
  id: string;
  numero: string;
  pedido_id?: string;
  pedido_numero?: string;
  cliente_id: string;
  cliente_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  motivo: string;
  estado: string;
  fecha: string;
  observaciones?: string;
  items: DetalleDevolucion[];
  created_at: string;
}

export interface DetalleDevolucion {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  producto_unidad: string;
  cantidad: number;
  motivo_item?: string;
}

// Supplier Invoices (Facturas de Proveedor)
export interface FacturaProveedorList {
  id: string;
  numero: string;
  proveedor_nombre: string;
  tipo: string;
  fecha_emision: string;
  total: number;
  estado: string;
  created_at: string;
}

export interface FacturaProveedorDetail {
  id: string;
  numero: string;
  proveedor_id: string;
  proveedor_nombre: string;
  orden_compra_id?: string;
  orden_compra_numero?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  tipo: string;
  fecha_emision: string;
  fecha_vencimiento?: string;
  subtotal: number;
  impuestos: number;
  total: number;
  estado: string;
  observaciones?: string;
  items: DetalleFacturaProveedor[];
  created_at: string;
}

export interface DetalleFacturaProveedor {
  id: string;
  producto_id?: string;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

// Supplier Returns (Devoluciones a Proveedor)
export interface DevolucionProveedorList {
  id: string;
  numero: string;
  proveedor_nombre: string;
  motivo: string;
  estado: string;
  fecha: string;
  created_at: string;
}

export interface DevolucionProveedorDetail {
  id: string;
  numero: string;
  proveedor_id: string;
  proveedor_nombre: string;
  orden_compra_id?: string;
  orden_compra_numero?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  motivo: string;
  estado: string;
  fecha: string;
  observaciones?: string;
  items: DetalleDevolucionProveedor[];
  created_at: string;
}

export interface DetalleDevolucionProveedor {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  cantidad: number;
  motivo_item?: string;
}

// Salidas Vendedor
export interface SalidaVendedor {
  id: string;
  empleado_id: string;
  empleado_nombre: string;
  sucursal_id: string;
  sucursal_nombre?: string;
  fecha: string;
  hora_salida?: string;
  hora_regreso?: string;
  km_inicio?: number;
  km_fin?: number;
  km_recorridos: number;
  estado: string;
  observaciones?: string;
  created_at: string;
}

// Sales KPIs
export interface SalesKPIData {
  conversion_rate: number;
  avg_order_value: number;
  total_revenue_30d: number;
  total_orders_30d: number;
  top_sellers: TopSellerItem[];
  top_products: TopProductItem[];
  top_clients: TopClientItem[];
  sales_trend: SalesTrendItem[];
  status_breakdown: StatusItem[];
}

export interface TopSellerItem {
  empleado_id: string;
  empleado_nombre: string;
  total_ventas: number;
  cantidad_pedidos: number;
}

export interface TopProductItem {
  producto_id: string;
  producto_nombre: string;
  cantidad_vendida: number;
  monto_total: number;
}

export interface TopClientItem {
  cliente_id: string;
  cliente_nombre: string;
  total_compras: number;
  cantidad_pedidos: number;
}

export interface SalesTrendItem {
  fecha: string;
  monto: number;
  cantidad: number;
}

export interface StatusItem {
  estado: string;
  cantidad: number;
}

// Customer Loyalty
export interface ProgramaFidelidad {
  id: string;
  nombre: string;
  puntos_por_peso: number;
  valor_punto: number;
  minimo_canje: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export interface PuntosCliente {
  id: string;
  cliente_id: string;
  tipo: string;
  puntos: number;
  saldo_anterior: number;
  saldo_nuevo: number;
  referencia_id?: string;
  referencia_tipo?: string;
  descripcion?: string;
  created_at: string;
}

export interface ClientePuntosResumen {
  cliente_id: string;
  cliente_nombre: string;
  saldo_actual: number;
  total_acumulado: number;
  total_canjeado: number;
}

// Audit Log
export interface AuditLogEntry {
  id: string;
  actor_id: string;
  actor_nombre?: string;
  usuario_nombre?: string;
  accion: string;
  entidad: string;
  entidad_id: string;
  datos_anteriores?: Record<string, unknown>;
  datos_nuevos?: Record<string, unknown>;
  ip?: string;
  created_at: string;
}

// Payments (Accounts Receivable)
export interface Pago {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nombre: string;
  sucursal_id: string;
  tipo: string;
  monto: number;
  fecha_pago: string;
  referencia?: string;
  estado: string;
  created_at: string;
}

export interface PagoDetail extends Pago {
  metodo_pago_id?: string;
  caja_id?: string;
  observaciones?: string;
  aplicaciones: AplicacionPago[];
}

export interface AplicacionPago {
  id: string;
  pago_id: string;
  comprobante_id: string;
  comprobante_numero?: string;
  comprobante_total?: number;
  monto_aplicado: number;
}

export interface AgingBucket {
  rango: string;
  monto: number;
  cantidad: number;
}

export interface ComprobanteConDeuda {
  id: string;
  tipo: string;
  letra: string;
  numero: string;
  cliente_id: string;
  cliente_nombre: string;
  total: number;
  pagado: number;
  saldo: number;
  saldo_pendiente: number;
  fecha_emision: string;
}

export interface ClienteBalance {
  cliente_id: string;
  saldo: number;
  limite_credito: number;
  disponible: number;
}

// Payments (Accounts Payable)
export interface PagoProveedor {
  id: string;
  numero: string;
  proveedor_id: string;
  proveedor_nombre: string;
  sucursal_id: string;
  tipo: string;
  monto: number;
  fecha_pago: string;
  referencia?: string;
  estado: string;
  created_at: string;
}

export interface PagoProveedorDetail extends PagoProveedor {
  observaciones?: string;
  aplicaciones: AplicacionPagoProveedor[];
}

export interface AplicacionPagoProveedor {
  id: string;
  pago_proveedor_id: string;
  orden_compra_id: string;
  orden_compra_numero?: string;
  orden_compra_total?: number;
  monto_aplicado: number;
}

// Remitos (Delivery Notes)
export interface RemitoList {
  id: string;
  numero: string;
  pedido_numero?: string;
  cliente_nombre: string;
  estado: string;
  fecha_emision: string;
  created_at: string;
}

export interface RemitoDetail {
  id: string;
  numero: string;
  pedido_id?: string;
  pedido_numero?: string;
  cliente_id: string;
  cliente_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  estado: string;
  fecha_emision: string;
  transportista?: string;
  patente?: string;
  observaciones?: string;
  firma_url?: string;
  items: DetalleRemito[];
  created_at: string;
}

export interface DetalleRemito {
  id: string;
  producto_id?: string;
  producto_nombre: string;
  producto_codigo?: string;
  producto_unidad: string;
  cantidad: number;
  cantidad_entregada: number;
  orden: number;
}

// Rutas
export interface RutaList {
  id: string;
  nombre: string;
  zona_nombre?: string;
  sucursal_nombre: string;
  paradas_count: number;
  activa: boolean;
}

export interface RutaDetail {
  id: string;
  nombre: string;
  zona_id?: string;
  zona_nombre?: string;
  vehiculo_id?: string;
  vehiculo_patente?: string;
  vehiculo_descripcion?: string;
  sucursal_id: string;
  sucursal_nombre: string;
  dia_semana?: number | null;
  hora_salida_estimada?: string;
  notas?: string;
  activa: boolean;
  paradas: RutaParada[];
}

export interface RutaParada {
  id: string;
  ruta_id: string;
  cliente_id: string;
  cliente_nombre: string;
  direccion_id?: string;
  direccion_resumen?: string;
  direccion_calle?: string;
  direccion_numero?: string;
  direccion_ciudad?: string;
  orden: number;
  frecuencia?: string;
  tiempo_estimado_minutos?: number;
  notas?: string;
}

// Notificaciones
export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  enlace?: string;
  created_at: string;
}

// Bank Reconciliation
export interface ExtractoBancario {
  id: string;
  entidad_bancaria_id: string;
  entidad_nombre: string;
  fecha_desde: string;
  fecha_hasta: string;
  estado: string;
  movimientos_count: number;
  conciliados_count: number;
  created_at: string;
}

export interface ExtractoBancarioDetail extends ExtractoBancario {
  archivo_nombre?: string;
  movimientos: MovimientoBancario[];
}

export interface MovimientoBancario {
  id: string;
  extracto_id: string;
  fecha: string;
  descripcion: string;
  monto: number;
  tipo: string;
  estado: string;
  estado_conciliacion: string;
  movimiento_caja_id?: string;
}

export interface MovCajaParaConciliar {
  id: string;
  caja_nombre: string;
  tipo: string;
  monto: number;
  concepto: string;
  created_at: string;
}

export interface MovimientoCajaWithCaja extends MovimientoCaja {
  caja_nombre: string;
}

// Tasks
export interface Task {
  id: string;
  titulo: string;
  descripcion?: string;
  prioridad: string;
  estado: string;
  asignado_a?: string;
  asignado_nombre?: string;
  fecha_limite?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  autor_id: string;
  autor_nombre: string;
  usuario_nombre?: string;
  contenido: string;
  created_at: string;
}

// Plantillas Pedido
export interface PlantillaPedidoList {
  id: string;
  nombre: string;
  cliente_nombre: string;
  sucursal_nombre: string;
  frecuencia_dias: number;
  activa: boolean;
  items_count: number;
}

export interface PlantillaPedidoDetail {
  id: string;
  nombre: string;
  cliente_id: string;
  cliente_nombre: string;
  sucursal_id: string;
  sucursal_nombre: string;
  frecuencia_dias: number;
  activa: boolean;
  proximo_generacion?: string;
  items: DetallePlantillaPedido[];
}

export interface DetallePlantillaPedido {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  producto_unidad?: string;
  cantidad: number;
  precio: number;
}

// Promociones
export interface Promocion {
  id: string;
  nombre: string;
  tipo: string;
  valor: number;
  cantidad_minima?: number;
  producto_id?: string;
  producto_nombre?: string;
  categoria_id?: string;
  categoria_nombre?: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  sucursal_id?: string;
  sucursal_nombre?: string;
  created_at: string;
}

// CategoriaCliente
export interface CategoriaCliente {
  id: string;
  nombre: string;
  descripcion?: string;
  descuento_porcentaje: number;
  created_at: string;
}

// Configuracion Empresa
export interface ConfiguracionEmpresa {
  id: string;
  razon_social: string;
  cuit?: string;
  condicion_iva?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
  pie_factura?: string;
}

// Conversiones de Unidad
export interface ConversionUnidad {
  id: string;
  from_unit: string;
  to_unit: string;
  factor: number;
}

export interface ConvertResult {
  from_unit: string;
  to_unit: string;
  from_qty: number;
  to_qty: number;
  factor: number;
}

// MetaVenta
export interface MetaVenta {
  id: string;
  nombre: string;
  tipo: string;
  empleado_id?: string;
  empleado_nombre?: string;
  sucursal_id?: string;
  sucursal_nombre?: string;
  monto_objetivo: number;
  monto_actual: number;
  porcentaje_avance: number;
  progreso: number;
  fecha_inicio: string;
  fecha_fin: string;
  created_at: string;
}

// MantenimientoVehiculo
export interface MantenimientoVehiculo {
  id: string;
  vehiculo_id: string;
  vehiculo_patente?: string;
  vehiculo_descripcion?: string;
  tipo: string;
  descripcion?: string;
  fecha: string;
  proximo_fecha?: string;
  proximo_km?: number;
  costo?: number;
  proveedor?: string;
  numero_factura?: string;
  created_at: string;
}

// Variantes de Producto
export interface VarianteProducto {
  id: string;
  producto_id: string;
  nombre: string;
  opciones: OpcionVariante[];
}

export interface OpcionVariante {
  id: string;
  variante_id: string;
  valor: string;
}

export interface SKUVariante {
  id: string;
  producto_id: string;
  sku: string;
  precio?: number;
  stock?: number;
  precio_adicional: number;
  stock_adicional: number;
  opciones: Record<string, string>;
  opciones_ids: string[];
  activo: boolean;
}

// Contratos (Employee Contracts)
export interface Contrato {
  id: string;
  empleado_id: string;
  tipo: string;
  fecha_inicio: string;
  fecha_fin?: string;
  salario?: number;
  observaciones?: string;
  estado: string;
  created_at: string;
}

// Convenios (Supplier Agreements)
export interface ConvenioProveedor {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  items_count: number;
  created_at: string;
}

export interface ConvenioDetail {
  id: string;
  proveedor_id: string;
  proveedor_nombre: string;
  nombre: string;
  fecha_inicio: string;
  fecha_fin?: string;
  activo: boolean;
  items: ConvenioItem[];
}

export interface ConvenioItem {
  id: string;
  producto_id: string;
  producto_nombre: string;
  producto_codigo?: string;
  precio_convenido: number;
  cantidad_minima: number;
  descuento_porcentaje: number;
}

// Evaluaciones de Proveedor
export interface EvaluacionProveedor {
  id: string;
  proveedor_id: string;
  evaluador_id: string;
  evaluador_nombre?: string;
  calidad: number;
  puntualidad: number;
  precio: number;
  comunicacion: number;
  promedio: number;
  comentario?: string;
  created_at: string;
}

export interface PromedioEvaluacion {
  calidad: number;
  puntualidad: number;
  precio: number;
  comunicacion: number;
  promedio: number;
  total_evaluaciones: number;
}

// Bank Dashboard
export interface BankDashboardData {
  accounts: BankAccountSummary[];
  cuentas: BankAccountSummary[];
  total_saldo: number;
  total_balance: number;
  total_cash: number;
  total_bank: number;
}

export interface BankAccountSummary {
  id: string;
  entidad_bancaria_id: string;
  entidad_nombre: string;
  nombre: string;
  sucursal_banco?: string;
  sucursal_nombre?: string;
  numero_cuenta?: string;
  cbu?: string;
  alias?: string;
  caja_nombre?: string;
  saldo: number;
}

export interface FinancialIndices {
  liquidez: number;
  endeudamiento: number;
  rentabilidad: number;
  current_ratio: number;
  profit_margin: number;
  dso: number;
  dpo: number;
  revenue_30d: number;
  expenses_30d: number;
  net_income_30d: number;
  avg_order_value: number;
  orders_count_30d: number;
  collection_rate: number;
}

// Customer Visits
export interface VisitaCliente {
  id: string;
  vendedor_id?: string;
  vendedor_nombre: string;
  cliente_id: string;
  cliente_nombre: string;
  direccion_id?: string;
  direccion_resumen?: string;
  fecha: string;
  hora_inicio?: string;
  hora_fin?: string;
  duracion_minutos?: number;
  resultado: string;
  pedido_generado_id?: string;
  latitud?: number;
  longitud?: number;
  notas?: string;
  created_at: string;
}
