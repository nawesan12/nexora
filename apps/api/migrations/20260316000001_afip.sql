-- AFIP configuration per sucursal
CREATE TABLE afip_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    cuit VARCHAR(20) NOT NULL,
    punto_venta INTEGER NOT NULL,
    certificado_pem TEXT,
    clave_privada_pem TEXT,
    modo VARCHAR(10) NOT NULL DEFAULT 'TESTING',
    activo BOOLEAN NOT NULL DEFAULT FALSE,
    token TEXT,
    sign TEXT,
    token_expiracion TIMESTAMPTZ,
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_afip_config_sucursal ON afip_config(sucursal_id);

-- Track AFIP invoice numbering per punto_venta + tipo + letra
CREATE TABLE afip_numeracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    afip_config_id UUID NOT NULL REFERENCES afip_config(id),
    tipo_comprobante tipo_comprobante NOT NULL,
    letra_comprobante letra_comprobante NOT NULL,
    ultimo_numero BIGINT NOT NULL DEFAULT 0,
    UNIQUE(afip_config_id, tipo_comprobante, letra_comprobante)
);

-- AFIP status on comprobantes
CREATE TYPE afip_estado AS ENUM ('NO_APLICA', 'PENDIENTE', 'AUTORIZADO', 'RECHAZADO');
ALTER TABLE comprobantes ADD COLUMN afip_estado afip_estado NOT NULL DEFAULT 'NO_APLICA';
