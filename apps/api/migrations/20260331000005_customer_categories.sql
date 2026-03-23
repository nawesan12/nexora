CREATE TABLE categorias_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS categoria_id UUID REFERENCES categorias_cliente(id);
