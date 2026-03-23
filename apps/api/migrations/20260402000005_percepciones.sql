CREATE TABLE configuracion_percepciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    alicuota NUMERIC(5,2) NOT NULL,
    provincia VARCHAR(100),
    activa BOOLEAN NOT NULL DEFAULT true,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE percepciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL,
    comprobante_id UUID REFERENCES comprobantes(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    base_imponible NUMERIC(14,2) NOT NULL,
    alicuota NUMERIC(5,2) NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    periodo VARCHAR(7) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_percepciones_comprobante ON percepciones(comprobante_id);
CREATE INDEX idx_percepciones_periodo ON percepciones(periodo);
CREATE INDEX idx_percepciones_usuario ON percepciones(usuario_id);
