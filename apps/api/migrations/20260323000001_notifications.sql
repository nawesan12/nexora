CREATE TYPE tipo_notificacion AS ENUM ('INFO','ALERTA','APROBACION','STOCK_BAJO','PAGO_VENCIDO','PEDIDO_ESTADO','REPARTO_ESTADO','SISTEMA');

CREATE TABLE notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destinatario_id UUID NOT NULL REFERENCES usuarios(id),
    tipo tipo_notificacion NOT NULL DEFAULT 'INFO',
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    enlace VARCHAR(500),
    leida BOOLEAN NOT NULL DEFAULT false,
    fecha_leida TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notificaciones_dest ON notificaciones(destinatario_id, leida, created_at DESC);
