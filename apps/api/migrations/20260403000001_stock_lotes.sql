CREATE TABLE lotes_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    numero_lote VARCHAR(100) NOT NULL,
    fecha_fabricacion DATE,
    fecha_vencimiento DATE,
    cantidad_inicial NUMERIC(14,2) NOT NULL,
    cantidad_actual NUMERIC(14,2) NOT NULL,
    costo_unitario NUMERIC(14,2),
    proveedor_id UUID REFERENCES proveedores(id),
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_lotes_producto ON lotes_stock(producto_id);
CREATE INDEX idx_lotes_sucursal ON lotes_stock(sucursal_id);
CREATE INDEX idx_lotes_vencimiento ON lotes_stock(fecha_vencimiento);
CREATE INDEX idx_lotes_usuario ON lotes_stock(usuario_id);

-- Track lot movements for FIFO
CREATE TABLE movimientos_lote (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lote_id UUID NOT NULL REFERENCES lotes_stock(id),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO', 'AJUSTE')),
    cantidad NUMERIC(14,2) NOT NULL,
    referencia_tipo VARCHAR(30), -- PEDIDO, ORDEN_COMPRA, AJUSTE, TRANSFERENCIA
    referencia_id UUID,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_mov_lote_lote ON movimientos_lote(lote_id);
