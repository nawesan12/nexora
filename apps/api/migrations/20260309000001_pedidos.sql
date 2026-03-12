-- Enums for orders module
CREATE TYPE estado_pedido AS ENUM (
  'PENDIENTE_APROBACION','EN_EVALUACION','APROBADO','APROBADO_REPARTIDOR',
  'RECHAZADO','EN_CONSOLIDACION','EN_PREPARACION','LISTO_PARA_ENVIO',
  'ENVIADO','ENTREGADO','ABASTECIDO','ENTREGADO_PARCIALMENTE',
  'CANCELADO','RECLAMADO','PENDIENTE_ABASTECIMIENTO','NO_ENTREGADO'
);

CREATE TYPE condicion_pago AS ENUM (
  'CONTADO','CUENTA_CORRIENTE','CHEQUE','TRANSFERENCIA','OTRO'
);

CREATE TYPE tipo_impuesto AS ENUM (
  'IVA','IIBB','PERCEPCION_IVA','PERCEPCION_IIBB','OTRO'
);

-- Sequence for order numbers
CREATE SEQUENCE pedido_numero_seq START 1;

-- Orders header
CREATE TABLE pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  direccion_id UUID REFERENCES direcciones(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  empleado_id UUID REFERENCES empleados(id),
  estado estado_pedido NOT NULL DEFAULT 'PENDIENTE_APROBACION',
  condicion_pago condicion_pago NOT NULL DEFAULT 'CONTADO',
  fecha_pedido TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_entrega_estimada DATE,
  fecha_entrega_real TIMESTAMPTZ,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_imponible NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  observaciones_internas TEXT,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_pedidos_numero_usuario ON pedidos(numero, usuario_id);
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_sucursal ON pedidos(sucursal_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_pedido);
CREATE INDEX idx_pedidos_empleado ON pedidos(empleado_id);
CREATE INDEX idx_pedidos_usuario_estado_fecha ON pedidos(usuario_id, estado, fecha_pedido);

-- Order line items
CREATE TABLE detalle_pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  producto_nombre VARCHAR(300) NOT NULL,
  producto_codigo VARCHAR(50),
  producto_unidad VARCHAR(20) NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  cantidad_entregada NUMERIC(10,2) NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_detalle_pedidos_pedido ON detalle_pedidos(pedido_id);

-- Per-order tax lines
CREATE TABLE impuestos_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  tipo tipo_impuesto NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  porcentaje NUMERIC(5,2) NOT NULL,
  base_imponible NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_impuestos_pedido_pedido ON impuestos_pedido(pedido_id);

-- Tenant default tax rates
CREATE TABLE configuracion_impuestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(100) NOT NULL,
  tipo tipo_impuesto NOT NULL,
  porcentaje NUMERIC(5,2) NOT NULL,
  aplicar_por_defecto BOOLEAN NOT NULL DEFAULT FALSE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_config_impuestos_usuario ON configuracion_impuestos(usuario_id);

-- Order status audit trail
CREATE TABLE historial_pedido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  estado_anterior estado_pedido,
  estado_nuevo estado_pedido NOT NULL,
  empleado_id UUID REFERENCES empleados(id),
  comentario TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historial_pedido_pedido ON historial_pedido(pedido_id);
