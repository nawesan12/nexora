CREATE TYPE tipo_contrato_enum AS ENUM ('RELACION_DEPENDENCIA', 'MONOTRIBUTO', 'EVENTUAL', 'PASANTE');
CREATE TABLE contratos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empleado_id UUID NOT NULL REFERENCES empleados(id),
    tipo tipo_contrato_enum NOT NULL,
    salario NUMERIC(14,2),
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    descripcion TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
