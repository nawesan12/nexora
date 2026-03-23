-- 20260401000002_unit_conversions.sql
CREATE TABLE conversiones_unidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_unit VARCHAR(20) NOT NULL,
    to_unit VARCHAR(20) NOT NULL,
    factor NUMERIC(14,6) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(from_unit, to_unit, usuario_id)
);
