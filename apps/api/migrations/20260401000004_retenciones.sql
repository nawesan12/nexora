CREATE TABLE retenciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(30) NOT NULL, -- IIBB, GANANCIAS, IVA, SUSS
    entidad_tipo VARCHAR(20) NOT NULL, -- CLIENTE, PROVEEDOR
    entidad_id UUID NOT NULL, -- references clientes or proveedores
    pago_id UUID, -- references pagos or pagos_proveedor
    numero_certificado VARCHAR(50),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    base_imponible NUMERIC(14,2) NOT NULL,
    alicuota NUMERIC(5,2) NOT NULL,
    monto NUMERIC(14,2) NOT NULL,
    periodo VARCHAR(7), -- YYYY-MM
    estado VARCHAR(20) NOT NULL DEFAULT 'EMITIDA', -- EMITIDA, APLICADA, ANULADA
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_retenciones_entidad ON retenciones(entidad_tipo, entidad_id);
CREATE INDEX idx_retenciones_periodo ON retenciones(periodo);
CREATE INDEX idx_retenciones_tipo ON retenciones(tipo);
