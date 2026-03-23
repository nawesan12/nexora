CREATE TABLE mantenimiento_vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehiculo_id UUID NOT NULL REFERENCES vehiculos(id),
    tipo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    proximo_fecha DATE,
    proximo_km INTEGER,
    costo NUMERIC(14,2),
    proveedor VARCHAR(200),
    numero_factura VARCHAR(100),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mant_vehiculos_vehiculo ON mantenimiento_vehiculos(vehiculo_id);

ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS km_actual INTEGER DEFAULT 0;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS seguro_vencimiento DATE;
ALTER TABLE vehiculos ADD COLUMN IF NOT EXISTS vtv_vencimiento DATE;
