ALTER TABLE entidades_bancarias ADD COLUMN exento_debcred BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE impuesto_debcred (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    movimiento_caja_id UUID REFERENCES movimientos_caja(id),
    tipo VARCHAR(10) NOT NULL CHECK (tipo IN ('DEBITO', 'CREDITO')),
    base_imponible NUMERIC(14,2) NOT NULL,
    alicuota NUMERIC(5,4) NOT NULL DEFAULT 0.006,
    monto NUMERIC(14,2) NOT NULL,
    periodo VARCHAR(7) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_impuesto_debcred_periodo ON impuesto_debcred(periodo);
CREATE INDEX idx_impuesto_debcred_usuario ON impuesto_debcred(usuario_id);
