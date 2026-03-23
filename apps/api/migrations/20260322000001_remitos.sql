CREATE TYPE estado_remito AS ENUM ('BORRADOR','EMITIDO','ENTREGADO','ANULADO');

CREATE TABLE remitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(30) NOT NULL,
    estado estado_remito NOT NULL DEFAULT 'BORRADOR',
    pedido_id UUID REFERENCES pedidos(id),
    reparto_id UUID REFERENCES repartos(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    direccion_id UUID REFERENCES direcciones(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    transportista VARCHAR(200),
    patente VARCHAR(20),
    observaciones TEXT,
    firma_url TEXT,
    foto_url TEXT,
    recibido_por VARCHAR(200),
    fecha_recepcion TIMESTAMPTZ,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_remitos_pedido ON remitos(pedido_id);
CREATE INDEX idx_remitos_cliente ON remitos(cliente_id);
CREATE INDEX idx_remitos_usuario ON remitos(usuario_id);

CREATE TABLE detalle_remitos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    remito_id UUID NOT NULL REFERENCES remitos(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id),
    producto_nombre VARCHAR(300) NOT NULL,
    producto_codigo VARCHAR(50),
    producto_unidad VARCHAR(20) NOT NULL,
    cantidad NUMERIC(14,2) NOT NULL,
    cantidad_entregada NUMERIC(14,2) NOT NULL DEFAULT 0,
    orden INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_detalle_remitos_remito ON detalle_remitos(remito_id);

CREATE SEQUENCE IF NOT EXISTS remito_numero_seq START 1;
