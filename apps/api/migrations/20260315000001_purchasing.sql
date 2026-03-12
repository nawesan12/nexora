-- Purchase order states
CREATE TYPE estado_orden_compra AS ENUM (
  'BORRADOR','APROBADA','EN_RECEPCION','RECIBIDA','RECIBIDA_PARCIALMENTE','CANCELADA'
);

-- Sequences
CREATE SEQUENCE orden_compra_numero_seq START 1;

-- Suppliers
CREATE TABLE proveedores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(200) NOT NULL,
  cuit VARCHAR(20),
  condicion_iva condicion_iva,
  email VARCHAR(255),
  telefono VARCHAR(50),
  direccion TEXT,
  contacto VARCHAR(200),
  banco VARCHAR(100),
  cbu VARCHAR(50),
  alias VARCHAR(50),
  notas TEXT,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_proveedores_cuit_usuario ON proveedores(cuit, usuario_id) WHERE cuit IS NOT NULL AND cuit != '';
CREATE INDEX idx_proveedores_usuario ON proveedores(usuario_id);
CREATE INDEX idx_proveedores_nombre ON proveedores(nombre);

-- Purchase Orders
CREATE TABLE ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero VARCHAR(20) NOT NULL,
  proveedor_id UUID NOT NULL REFERENCES proveedores(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  estado estado_orden_compra NOT NULL DEFAULT 'BORRADOR',
  condicion_pago condicion_pago NOT NULL DEFAULT 'CONTADO',
  fecha_orden DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_entrega_estimada DATE,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_imponible NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  observaciones TEXT,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_ordenes_compra_numero_usuario ON ordenes_compra(numero, usuario_id);
CREATE INDEX idx_ordenes_compra_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_compra_estado ON ordenes_compra(estado);
CREATE INDEX idx_ordenes_compra_usuario ON ordenes_compra(usuario_id);
CREATE INDEX idx_ordenes_compra_fecha ON ordenes_compra(fecha_orden);

-- Line items
CREATE TABLE detalle_ordenes_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  producto_id UUID NOT NULL REFERENCES productos(id),
  producto_nombre VARCHAR(300) NOT NULL,
  producto_codigo VARCHAR(50),
  cantidad NUMERIC(10,2) NOT NULL,
  cantidad_recibida NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_unitario NUMERIC(12,2) NOT NULL,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(14,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_detalle_ordenes_compra_orden ON detalle_ordenes_compra(orden_compra_id);

-- Tax lines for purchase orders (mirrors impuestos_pedido)
CREATE TABLE impuestos_orden_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  tipo tipo_impuesto NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  base_imponible NUMERIC(14,2) NOT NULL DEFAULT 0,
  monto NUMERIC(14,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_impuestos_orden_compra_orden ON impuestos_orden_compra(orden_compra_id);

-- Audit trail
CREATE TABLE historial_orden_compra (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
  estado_anterior estado_orden_compra,
  estado_nuevo estado_orden_compra NOT NULL,
  comentario TEXT,
  empleado_id UUID REFERENCES empleados(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_historial_orden_compra_orden ON historial_orden_compra(orden_compra_id);
