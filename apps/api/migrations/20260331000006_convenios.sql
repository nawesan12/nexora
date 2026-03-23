CREATE TABLE convenios_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    nombre VARCHAR(300) NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    activo BOOLEAN NOT NULL DEFAULT true,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE detalle_convenio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    convenio_id UUID NOT NULL REFERENCES convenios_proveedor(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    precio_convenido NUMERIC(14,2) NOT NULL,
    cantidad_minima INTEGER DEFAULT 1,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0
);
