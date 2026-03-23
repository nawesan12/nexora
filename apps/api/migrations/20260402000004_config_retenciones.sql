CREATE TABLE configuracion_retenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    alicuota NUMERIC(5,2) NOT NULL,
    monto_minimo NUMERIC(14,2) NOT NULL DEFAULT 0,
    activa BOOLEAN NOT NULL DEFAULT true,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE retenciones ADD COLUMN IF NOT EXISTS pago_proveedor_id UUID REFERENCES pagos_proveedor(id);
ALTER TABLE retenciones ADD COLUMN IF NOT EXISTS auto_generada BOOLEAN NOT NULL DEFAULT false;

CREATE SEQUENCE IF NOT EXISTS retencion_cert_seq START 1;
