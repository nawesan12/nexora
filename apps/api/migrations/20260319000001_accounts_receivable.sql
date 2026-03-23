-- Create new enum types
CREATE TYPE tipo_pago AS ENUM ('EFECTIVO','TRANSFERENCIA','CHEQUE','TARJETA','OTRO');
CREATE TYPE estado_pago AS ENUM ('PENDIENTE','CONFIRMADO','ANULADO');
CREATE TYPE estado_deuda AS ENUM ('PENDIENTE','PARCIAL','PAGADA','VENCIDA');

-- Add credit fields to clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS limite_credito NUMERIC(14,2) DEFAULT 0;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS saldo_deudor NUMERIC(14,2) DEFAULT 0;

-- Payments table
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(30) NOT NULL,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
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

CREATE INDEX idx_pagos_cliente ON pagos(cliente_id);
CREATE INDEX idx_pagos_usuario ON pagos(usuario_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);

-- Payment application (partial payments support)
CREATE TABLE aplicacion_pagos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id UUID NOT NULL REFERENCES pagos(id),
    comprobante_id UUID NOT NULL REFERENCES comprobantes(id),
    monto_aplicado NUMERIC(14,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aplicacion_pagos_pago ON aplicacion_pagos(pago_id);
CREATE INDEX idx_aplicacion_pagos_comprobante ON aplicacion_pagos(comprobante_id);

-- Add debt tracking fields to comprobantes
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS estado_deuda estado_deuda DEFAULT 'PENDIENTE';
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS monto_pagado NUMERIC(14,2) DEFAULT 0;
ALTER TABLE comprobantes ADD COLUMN IF NOT EXISTS fecha_vencimiento_pago DATE;
