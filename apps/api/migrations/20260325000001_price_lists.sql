CREATE TABLE listas_precios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL DEFAULT 'GENERAL',
    activa BOOLEAN NOT NULL DEFAULT true,
    fecha_desde DATE,
    fecha_hasta DATE,
    sucursal_id UUID REFERENCES sucursales(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE precios_lista (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lista_id UUID NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    precio NUMERIC(14,2) NOT NULL,
    descuento_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0,
    UNIQUE(lista_id, producto_id)
);
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS lista_precios_id UUID REFERENCES listas_precios(id);
