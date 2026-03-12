-- Logistics & Stock Movements

-- Enum types
CREATE TYPE tipo_movimiento_stock AS ENUM ('COMPRA','VENTA','AJUSTE','TRANSFERENCIA','DEVOLUCION','QUIEBRE');
CREATE TYPE estado_transferencia AS ENUM ('PENDIENTE','APROBADA','EN_TRANSITO','COMPLETADA','CANCELADA');
CREATE TYPE estado_reparto AS ENUM ('PLANIFICADO','EN_CURSO','FINALIZADO','CANCELADO');
CREATE TYPE tipo_evento_reparto AS ENUM ('LLEGADA','ENTREGA','NO_ENTREGA','ENTREGA_PARCIAL','COBRO');

-- movimientos_stock (immutable audit trail, no active column)
CREATE TABLE movimientos_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    tipo tipo_movimiento_stock NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    motivo VARCHAR(500),
    referencia_id UUID,
    referencia_tipo VARCHAR(50),
    empleado_id UUID REFERENCES empleados(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movimientos_stock_producto ON movimientos_stock(producto_id);
CREATE INDEX idx_movimientos_stock_sucursal ON movimientos_stock(sucursal_id);
CREATE INDEX idx_movimientos_stock_usuario ON movimientos_stock(usuario_id);
CREATE INDEX idx_movimientos_stock_tipo ON movimientos_stock(tipo);
CREATE INDEX idx_movimientos_stock_created ON movimientos_stock(created_at);

-- transferencias_sucursal
CREATE SEQUENCE transferencia_numero_seq;

CREATE TABLE transferencias_sucursal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) NOT NULL,
    sucursal_origen_id UUID NOT NULL REFERENCES sucursales(id),
    sucursal_destino_id UUID NOT NULL REFERENCES sucursales(id),
    estado estado_transferencia NOT NULL DEFAULT 'PENDIENTE',
    fecha_solicitud TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    fecha_envio TIMESTAMPTZ,
    fecha_recepcion TIMESTAMPTZ,
    observaciones TEXT,
    aprobado_por UUID REFERENCES empleados(id),
    solicitado_por UUID REFERENCES empleados(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transferencias_usuario ON transferencias_sucursal(usuario_id);
CREATE INDEX idx_transferencias_estado ON transferencias_sucursal(estado);

-- items_transferencia
CREATE TABLE items_transferencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transferencia_id UUID NOT NULL REFERENCES transferencias_sucursal(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id),
    producto_nombre VARCHAR(300) NOT NULL,
    producto_codigo VARCHAR(50),
    cantidad_solicitada INTEGER NOT NULL,
    cantidad_enviada INTEGER NOT NULL DEFAULT 0,
    cantidad_recibida INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_items_transferencia_transferencia ON items_transferencia(transferencia_id);

-- vehiculos
CREATE TABLE vehiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marca VARCHAR(100) NOT NULL,
    modelo VARCHAR(100) NOT NULL,
    patente VARCHAR(20) NOT NULL,
    anio INTEGER,
    capacidad_kg NUMERIC(10,2),
    capacidad_volumen NUMERIC(10,2),
    sucursal_id UUID REFERENCES sucursales(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(patente, usuario_id)
);

CREATE INDEX idx_vehiculos_usuario ON vehiculos(usuario_id);

-- zonas
CREATE TABLE zonas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    sucursal_id UUID REFERENCES sucursales(id),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_zonas_usuario ON zonas(usuario_id);

-- repartos
CREATE SEQUENCE reparto_numero_seq;

CREATE TABLE repartos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero VARCHAR(20) NOT NULL,
    fecha DATE NOT NULL,
    estado estado_reparto NOT NULL DEFAULT 'PLANIFICADO',
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    vehiculo_id UUID REFERENCES vehiculos(id),
    zona_id UUID REFERENCES zonas(id),
    sucursal_id UUID NOT NULL REFERENCES sucursales(id),
    hora_salida TIMESTAMPTZ,
    hora_regreso TIMESTAMPTZ,
    km_inicio NUMERIC(10,2),
    km_fin NUMERIC(10,2),
    observaciones TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_repartos_usuario ON repartos(usuario_id);
CREATE INDEX idx_repartos_estado ON repartos(estado);
CREATE INDEX idx_repartos_fecha ON repartos(fecha);
CREATE INDEX idx_repartos_empleado ON repartos(empleado_id);

-- reparto_pedidos (M2M)
CREATE TABLE reparto_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reparto_id UUID NOT NULL REFERENCES repartos(id) ON DELETE CASCADE,
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    orden INTEGER NOT NULL DEFAULT 0,
    UNIQUE(reparto_id, pedido_id)
);

CREATE INDEX idx_reparto_pedidos_reparto ON reparto_pedidos(reparto_id);

-- eventos_reparto (immutable event log)
CREATE TABLE eventos_reparto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reparto_id UUID NOT NULL REFERENCES repartos(id) ON DELETE CASCADE,
    pedido_id UUID REFERENCES pedidos(id),
    tipo tipo_evento_reparto NOT NULL,
    latitud NUMERIC(10,7),
    longitud NUMERIC(10,7),
    comentario TEXT,
    monto_cobrado NUMERIC(14,2),
    empleado_id UUID REFERENCES empleados(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_eventos_reparto_reparto ON eventos_reparto(reparto_id);
