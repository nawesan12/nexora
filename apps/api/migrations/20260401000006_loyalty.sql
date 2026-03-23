-- 20260401000006_loyalty.sql

CREATE TABLE programa_fidelidad (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    puntos_por_peso NUMERIC(10,4) NOT NULL DEFAULT 1,
    valor_punto NUMERIC(10,4) NOT NULL DEFAULT 0.01,
    minimo_canje INTEGER NOT NULL DEFAULT 100,
    activo BOOLEAN NOT NULL DEFAULT true,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE puntos_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    tipo VARCHAR(20) NOT NULL,
    puntos INTEGER NOT NULL,
    saldo_anterior INTEGER NOT NULL DEFAULT 0,
    saldo_nuevo INTEGER NOT NULL DEFAULT 0,
    referencia_id UUID,
    referencia_tipo VARCHAR(30),
    descripcion VARCHAR(300),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_puntos_cliente ON puntos_cliente(cliente_id);
