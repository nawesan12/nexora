-- 20260401000007_visitas_cliente.sql
CREATE TABLE visitas_cliente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NOT NULL REFERENCES empleados(id),
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    direccion_id UUID REFERENCES direcciones(id),
    fecha DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_inicio TIME,
    hora_fin TIME,
    duracion_minutos INTEGER,
    resultado VARCHAR(30) NOT NULL DEFAULT 'PENDIENTE',
    pedido_generado_id UUID REFERENCES pedidos(id),
    latitud NUMERIC(10,7),
    longitud NUMERIC(10,7),
    notas TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visitas_vendedor ON visitas_cliente(vendedor_id);
CREATE INDEX idx_visitas_cliente ON visitas_cliente(cliente_id);
CREATE INDEX idx_visitas_fecha ON visitas_cliente(fecha);
