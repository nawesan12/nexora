-- 20260401000008_salidas_vendedor.sql
CREATE TABLE salidas_vendedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_salida TIMESTAMPTZ,
    hora_regreso TIMESTAMPTZ,
    km_inicio NUMERIC(10,1),
    km_fin NUMERIC(10,1),
    km_recorridos NUMERIC(10,1) GENERATED ALWAYS AS (COALESCE(km_fin, 0) - COALESCE(km_inicio, 0)) STORED,
    estado VARCHAR(20) NOT NULL DEFAULT 'EN_CAMPO',
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_salidas_vendedor_empleado ON salidas_vendedor(empleado_id);
CREATE INDEX idx_salidas_vendedor_fecha ON salidas_vendedor(fecha);
