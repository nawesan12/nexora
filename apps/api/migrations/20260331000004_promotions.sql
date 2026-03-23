CREATE TYPE tipo_promocion AS ENUM ('PORCENTAJE', 'MONTO_FIJO', 'CANTIDAD_MINIMA', 'COMBO');
CREATE TABLE promociones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(300) NOT NULL,
    tipo tipo_promocion NOT NULL,
    valor NUMERIC(14,2) NOT NULL,
    cantidad_minima INTEGER,
    producto_id UUID REFERENCES productos(id),
    categoria_id UUID REFERENCES categorias_producto(id),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT true,
    sucursal_id UUID REFERENCES sucursales(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
