CREATE TYPE estado_comprobante AS ENUM ('BORRADOR','EMITIDO','ANULADO');
CREATE TYPE tipo_comprobante AS ENUM ('FACTURA','NOTA_CREDITO','NOTA_DEBITO');
CREATE TYPE letra_comprobante AS ENUM ('A','B','N','X');

CREATE SEQUENCE comprobante_numero_seq START 1;

CREATE TABLE comprobantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo tipo_comprobante NOT NULL,
  letra letra_comprobante NOT NULL,
  numero VARCHAR(20) NOT NULL,
  estado estado_comprobante NOT NULL DEFAULT 'BORRADOR',
  -- Links
  pedido_id UUID REFERENCES pedidos(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  sucursal_id UUID NOT NULL REFERENCES sucursales(id),
  -- Amounts (snapshot from order)
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(14,2) NOT NULL DEFAULT 0,
  base_imponible NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
  total NUMERIC(14,2) NOT NULL DEFAULT 0,
  -- Tax detail (denormalized JSON for immutability)
  impuestos JSONB NOT NULL DEFAULT '[]',
  -- AFIP fields (nullable — filled when AFIP integration is active)
  cae VARCHAR(20),
  fecha_vencimiento_cae DATE,
  -- Dates
  fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
  condicion_pago condicion_pago NOT NULL DEFAULT 'CONTADO',
  observaciones TEXT,
  -- Tenant isolation
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_comprobantes_numero_tipo_letra_usuario ON comprobantes(numero, tipo, letra, usuario_id);
CREATE INDEX idx_comprobantes_pedido ON comprobantes(pedido_id);
CREATE INDEX idx_comprobantes_cliente ON comprobantes(cliente_id);
CREATE INDEX idx_comprobantes_estado ON comprobantes(estado);
CREATE INDEX idx_comprobantes_fecha ON comprobantes(fecha_emision);
CREATE INDEX idx_comprobantes_usuario ON comprobantes(usuario_id);

-- Line items (snapshot of order items at time of invoicing)
CREATE TABLE detalle_comprobantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprobante_id UUID NOT NULL REFERENCES comprobantes(id) ON DELETE CASCADE,
  producto_id UUID REFERENCES productos(id),
  producto_nombre VARCHAR(300) NOT NULL,
  producto_codigo VARCHAR(50),
  producto_unidad VARCHAR(20) NOT NULL,
  cantidad NUMERIC(10,2) NOT NULL,
  precio_unitario NUMERIC(12,2) NOT NULL,
  descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
  descuento_monto NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
  orden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_detalle_comprobantes_comprobante ON detalle_comprobantes(comprobante_id);
