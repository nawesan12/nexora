CREATE TYPE moneda AS ENUM ('ARS', 'USD');

CREATE TABLE cotizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    moneda_origen moneda NOT NULL DEFAULT 'USD',
    moneda_destino moneda NOT NULL DEFAULT 'ARS',
    tasa NUMERIC(14,6) NOT NULL,
    fuente VARCHAR(50) NOT NULL DEFAULT 'MANUAL',
    fecha DATE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(moneda_origen, moneda_destino, fecha, usuario_id)
);
CREATE INDEX idx_cotizaciones_fecha ON cotizaciones(fecha);
CREATE INDEX idx_cotizaciones_usuario ON cotizaciones(usuario_id);

-- Add currency fields to financial tables
ALTER TABLE pedidos ADD COLUMN moneda moneda NOT NULL DEFAULT 'ARS';
ALTER TABLE pedidos ADD COLUMN cotizacion NUMERIC(14,6) DEFAULT 1;
ALTER TABLE comprobantes ADD COLUMN moneda moneda NOT NULL DEFAULT 'ARS';
ALTER TABLE comprobantes ADD COLUMN cotizacion NUMERIC(14,6) DEFAULT 1;
ALTER TABLE pagos ADD COLUMN moneda moneda NOT NULL DEFAULT 'ARS';
ALTER TABLE pagos ADD COLUMN cotizacion NUMERIC(14,6) DEFAULT 1;
ALTER TABLE pagos_proveedor ADD COLUMN moneda moneda NOT NULL DEFAULT 'ARS';
ALTER TABLE pagos_proveedor ADD COLUMN cotizacion NUMERIC(14,6) DEFAULT 1;
