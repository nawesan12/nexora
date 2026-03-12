-- Finance module enums
CREATE TYPE tipo_caja AS ENUM ('EFECTIVO', 'BANCO');
CREATE TYPE tipo_movimiento AS ENUM ('INGRESO', 'EGRESO', 'AJUSTE');
CREATE TYPE estado_cheque AS ENUM ('RECIBIDO', 'DEPOSITADO', 'RECHAZADO', 'ENDOSADO', 'COBRADO');
CREATE TYPE estado_arqueo AS ENUM ('PENDIENTE_REVISION', 'APROBADO', 'RECHAZADO');
CREATE TYPE tipo_gasto AS ENUM ('OPERATIVO', 'ADMINISTRATIVO', 'LOGISTICA', 'COMERCIAL', 'IMPOSITIVO');
CREATE TYPE tipo_comision AS ENUM ('PORCENTAJE', 'FIJO', 'ESCALONADO');
CREATE TYPE estado_presupuesto AS ENUM ('BORRADOR', 'ENVIADO', 'APROBADO', 'RECHAZADO', 'VENCIDO');
CREATE TYPE estado_deuda AS ENUM ('PENDIENTE', 'PARCIAL', 'PAGADA', 'VENCIDA');

-- Cash boxes
CREATE TABLE cajas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  tipo tipo_caja NOT NULL DEFAULT 'EFECTIVO',
  saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cajas_usuario ON cajas(usuario_id);
CREATE INDEX idx_cajas_sucursal ON cajas(sucursal_id);

-- Cash box movements (immutable audit trail)
CREATE TABLE movimientos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
  tipo tipo_movimiento NOT NULL,
  monto NUMERIC(14,2) NOT NULL,
  concepto VARCHAR(500) NOT NULL,
  referencia_id UUID,
  referencia_tipo VARCHAR(50),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movimientos_caja_caja ON movimientos_caja(caja_id);
CREATE INDEX idx_movimientos_caja_usuario ON movimientos_caja(usuario_id);
CREATE INDEX idx_movimientos_caja_fecha ON movimientos_caja(created_at);

-- Cash box reconciliation
CREATE TABLE arqueos_caja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caja_id UUID NOT NULL REFERENCES cajas(id) ON DELETE CASCADE,
  monto_sistema NUMERIC(14,2) NOT NULL,
  monto_fisico NUMERIC(14,2) NOT NULL,
  diferencia NUMERIC(14,2) NOT NULL,
  estado estado_arqueo NOT NULL DEFAULT 'PENDIENTE_REVISION',
  observaciones TEXT,
  desglose JSONB,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_arqueos_caja_caja ON arqueos_caja(caja_id);

-- Bank entities
CREATE TABLE entidades_bancarias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  sucursal_banco VARCHAR(200),
  numero_cuenta VARCHAR(50),
  cbu VARCHAR(30),
  alias VARCHAR(100),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entidades_bancarias_usuario ON entidades_bancarias(usuario_id);

-- Checks
CREATE TABLE cheques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(50) NOT NULL,
  monto NUMERIC(14,2) NOT NULL,
  fecha_emision DATE NOT NULL,
  fecha_vencimiento DATE NOT NULL,
  estado estado_cheque NOT NULL DEFAULT 'RECIBIDO',
  banco VARCHAR(200),
  emisor VARCHAR(200),
  receptor VARCHAR(200),
  entidad_bancaria_id UUID REFERENCES entidades_bancarias(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cheques_usuario ON cheques(usuario_id);
CREATE INDEX idx_cheques_estado ON cheques(estado);
CREATE INDEX idx_cheques_vencimiento ON cheques(fecha_vencimiento);

-- Payment methods
CREATE TABLE metodos_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  comision_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_metodos_pago_usuario ON metodos_pago(usuario_id);

-- Expenses
CREATE TABLE gastos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto VARCHAR(500) NOT NULL,
  monto NUMERIC(14,2) NOT NULL,
  categoria tipo_gasto NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  comprobante VARCHAR(200),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gastos_usuario ON gastos(usuario_id);
CREATE INDEX idx_gastos_categoria ON gastos(categoria);
CREATE INDEX idx_gastos_fecha ON gastos(fecha);

-- Recurring expenses
CREATE TABLE gastos_recurrentes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concepto VARCHAR(500) NOT NULL,
  monto NUMERIC(14,2) NOT NULL,
  categoria tipo_gasto NOT NULL,
  frecuencia VARCHAR(20) NOT NULL,
  proxima_fecha DATE NOT NULL,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gastos_recurrentes_usuario ON gastos_recurrentes(usuario_id);

-- Budgets
CREATE TABLE presupuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  monto_asignado NUMERIC(14,2) NOT NULL,
  monto_utilizado NUMERIC(14,2) NOT NULL DEFAULT 0,
  periodo VARCHAR(50),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  estado estado_presupuesto NOT NULL DEFAULT 'BORRADOR',
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_presupuestos_usuario ON presupuestos(usuario_id);
CREATE INDEX idx_presupuestos_estado ON presupuestos(estado);

-- Commission configuration (per employee)
CREATE TABLE configuracion_comisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id),
  tipo_comision tipo_comision NOT NULL DEFAULT 'PORCENTAJE',
  porcentaje_base NUMERIC(5,2) NOT NULL DEFAULT 0,
  escalonamiento JSONB,
  activa BOOLEAN NOT NULL DEFAULT TRUE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_comisiones_usuario ON configuracion_comisiones(usuario_id);
CREATE INDEX idx_config_comisiones_empleado ON configuracion_comisiones(empleado_id);

-- Seller commissions (immutable records)
CREATE TABLE comisiones_vendedor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empleado_id UUID NOT NULL REFERENCES empleados(id),
  pedido_id UUID REFERENCES pedidos(id),
  monto NUMERIC(14,2) NOT NULL,
  porcentaje NUMERIC(5,2) NOT NULL,
  periodo VARCHAR(20),
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comisiones_vendedor_empleado ON comisiones_vendedor(empleado_id);
CREATE INDEX idx_comisiones_vendedor_usuario ON comisiones_vendedor(usuario_id);
