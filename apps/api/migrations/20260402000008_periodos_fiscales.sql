CREATE TABLE periodos_fiscales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anio INTEGER NOT NULL,
    mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
    estado VARCHAR(20) NOT NULL DEFAULT 'ABIERTO',
    fecha_cierre TIMESTAMPTZ,
    cerrado_por UUID REFERENCES usuarios(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(anio, mes, usuario_id)
);
CREATE INDEX idx_periodos_fiscales_usuario ON periodos_fiscales(usuario_id);
