-- Supplier Scorecard
CREATE TABLE evaluacion_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id),
    delivery_on_time BOOLEAN,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
    price_compliance BOOLEAN,
    comentario TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_eval_prov ON evaluacion_proveedor(proveedor_id);

-- Barcode
ALTER TABLE productos ADD COLUMN IF NOT EXISTS codigo_barras VARCHAR(50);
CREATE INDEX idx_productos_barcode ON productos(codigo_barras) WHERE codigo_barras IS NOT NULL;

-- Recurring Orders
CREATE TABLE plantilla_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    frecuencia_dias INTEGER NOT NULL DEFAULT 7,
    proximo_generacion DATE NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT true,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE detalle_plantilla_pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plantilla_id UUID NOT NULL REFERENCES plantilla_pedido(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad NUMERIC(14,2) NOT NULL,
    precio NUMERIC(14,2) NOT NULL
);
