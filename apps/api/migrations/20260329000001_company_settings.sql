CREATE TABLE configuracion_empresa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    razon_social VARCHAR(300) NOT NULL,
    cuit VARCHAR(20),
    condicion_iva VARCHAR(50),
    direccion VARCHAR(500),
    telefono VARCHAR(50),
    email VARCHAR(200),
    logo_url TEXT,
    pie_factura TEXT,
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
