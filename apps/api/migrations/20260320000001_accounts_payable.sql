-- Add saldo_deudor to proveedores
ALTER TABLE proveedores ADD COLUMN IF NOT EXISTS saldo_deudor NUMERIC(14,2) DEFAULT 0;

-- Add debt tracking to ordenes_compra
ALTER TABLE ordenes_compra ADD COLUMN IF NOT EXISTS estado_deuda estado_deuda DEFAULT 'PENDIENTE';
ALTER TABLE ordenes_compra ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC(14,2) DEFAULT 0;
ALTER TABLE ordenes_compra ADD COLUMN IF NOT EXISTS fecha_vencimiento_pago DATE;

-- Supplier payments
CREATE TABLE pagos_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(30) NOT NULL,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    tipo tipo_pago NOT NULL,
    estado estado_pago NOT NULL DEFAULT 'PENDIENTE',
    monto NUMERIC(14,2) NOT NULL,
    fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
    referencia VARCHAR(200),
    metodo_pago_id UUID REFERENCES metodos_pago(id),
    caja_id UUID REFERENCES cajas(id),
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pagos_proveedor_proveedor ON pagos_proveedor(proveedor_id);
CREATE INDEX idx_pagos_proveedor_usuario ON pagos_proveedor(usuario_id);

CREATE TABLE aplicacion_pagos_proveedor (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id UUID NOT NULL REFERENCES pagos_proveedor(id),
    orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id),
    monto_aplicado NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_app_pagos_prov_pago ON aplicacion_pagos_proveedor(pago_id);
CREATE INDEX idx_app_pagos_prov_oc ON aplicacion_pagos_proveedor(orden_compra_id);
