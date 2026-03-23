CREATE TABLE rutas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    zona_id UUID REFERENCES zonas(id),
    vehiculo_id UUID REFERENCES vehiculos(id),
    dia_semana INTEGER,
    hora_salida_estimada TIME,
    notas TEXT,
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_rutas_usuario ON rutas(usuario_id);
CREATE INDEX idx_rutas_zona ON rutas(zona_id);

CREATE TABLE ruta_paradas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ruta_id UUID NOT NULL REFERENCES rutas(id) ON DELETE CASCADE,
    cliente_id UUID NOT NULL REFERENCES clientes(id),
    direccion_id UUID REFERENCES direcciones(id),
    orden INTEGER NOT NULL DEFAULT 0,
    tiempo_estimado_minutos INTEGER DEFAULT 15,
    notas TEXT
);
CREATE INDEX idx_ruta_paradas_ruta ON ruta_paradas(ruta_id);
