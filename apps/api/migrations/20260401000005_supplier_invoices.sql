-- Supplier Invoices & Returns

CREATE TABLE facturas_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(50) NOT NULL,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    orden_compra_id UUID REFERENCES ordenes_compra(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    tipo VARCHAR(20) NOT NULL DEFAULT 'FACTURA_A',
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    subtotal NUMERIC(14,2) NOT NULL DEFAULT 0,
    impuestos NUMERIC(14,2) NOT NULL DEFAULT 0,
    total NUMERIC(14,2) NOT NULL DEFAULT 0,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE detalle_factura_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    factura_id UUID NOT NULL REFERENCES facturas_proveedor(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    descripcion VARCHAR(300) NOT NULL,
    cantidad NUMERIC(14,2) NOT NULL,
    precio_unitario NUMERIC(14,2) NOT NULL,
    subtotal NUMERIC(14,2) NOT NULL
);

CREATE SEQUENCE devolucion_proveedor_numero_seq START 1;

CREATE TABLE devoluciones_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) UNIQUE NOT NULL,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    orden_compra_id UUID REFERENCES ordenes_compra(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    motivo VARCHAR(500) NOT NULL,
    estado VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE',
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE detalle_devolucion_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    devolucion_id UUID NOT NULL REFERENCES devoluciones_proveedor(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    motivo_item VARCHAR(300)
);

CREATE INDEX idx_facturas_proveedor ON facturas_proveedor(proveedor_id);
CREATE INDEX idx_devoluciones_proveedor ON devoluciones_proveedor(proveedor_id);
