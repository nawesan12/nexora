CREATE TABLE variantes_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    nombre VARCHAR(200) NOT NULL,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE opciones_variante (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variante_id UUID NOT NULL REFERENCES variantes_producto(id) ON DELETE CASCADE,
    valor VARCHAR(200) NOT NULL,
    orden INTEGER DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE sku_variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    sku VARCHAR(100),
    precio_adicional NUMERIC(14,2) DEFAULT 0,
    stock_adicional INTEGER DEFAULT 0,
    opciones_ids UUID[] NOT NULL DEFAULT '{}',
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_variantes_producto ON variantes_producto(producto_id);
CREATE INDEX idx_opciones_variante ON opciones_variante(variante_id);
CREATE INDEX idx_sku_variantes_producto ON sku_variantes(producto_id);
