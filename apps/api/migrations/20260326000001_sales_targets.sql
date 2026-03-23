CREATE TYPE tipo_meta AS ENUM ('EMPLEADO','SUCURSAL');
CREATE TABLE metas_venta (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    tipo tipo_meta NOT NULL,
    empleado_id UUID REFERENCES empleados(id),
    sucursal_id UUID REFERENCES sucursales(id),
    monto_objetivo NUMERIC(14,2) NOT NULL,
    monto_actual NUMERIC(14,2) NOT NULL DEFAULT 0,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_metas_venta_usuario ON metas_venta(usuario_id);
