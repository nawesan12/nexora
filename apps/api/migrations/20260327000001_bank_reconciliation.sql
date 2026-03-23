CREATE TYPE estado_conciliacion AS ENUM ('PENDIENTE','CONCILIADO','DESCARTADO');
CREATE TABLE extractos_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entidad_bancaria_id UUID NOT NULL REFERENCES entidades_bancarias(id),
    fecha_desde DATE NOT NULL,
    fecha_hasta DATE NOT NULL,
    archivo_nombre VARCHAR(200),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE movimientos_bancarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    extracto_id UUID NOT NULL REFERENCES extractos_bancarios(id) ON DELETE CASCADE,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    referencia VARCHAR(200),
    estado_conciliacion estado_conciliacion NOT NULL DEFAULT 'PENDIENTE',
    movimiento_caja_id UUID REFERENCES movimientos_caja(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mov_bancarios_extracto ON movimientos_bancarios(extracto_id);
