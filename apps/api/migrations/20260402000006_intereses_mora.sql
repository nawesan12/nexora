-- Interest configuration
CREATE TABLE configuracion_intereses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tasa_mensual NUMERIC(5,2) NOT NULL DEFAULT 3.00,
    calculo VARCHAR(20) NOT NULL DEFAULT 'DIARIO',
    dias_gracia INTEGER NOT NULL DEFAULT 0,
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Per-client interest rate override
ALTER TABLE clientes ADD COLUMN tasa_interes_override NUMERIC(5,2);

-- Interest records
CREATE TABLE intereses_mora (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id UUID NOT NULL REFERENCES pagos(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    dias_mora INTEGER NOT NULL,
    capital NUMERIC(14,2) NOT NULL,
    tasa_aplicada NUMERIC(5,2) NOT NULL,
    monto_interes NUMERIC(14,2) NOT NULL,
    nota_debito_id UUID REFERENCES comprobantes(id),
    estado VARCHAR(20) NOT NULL DEFAULT 'CALCULADO',
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_intereses_mora_pago ON intereses_mora(pago_id);
CREATE INDEX idx_intereses_mora_cliente ON intereses_mora(cliente_id);
CREATE INDEX idx_intereses_mora_usuario ON intereses_mora(usuario_id);
