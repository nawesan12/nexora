-- Step 1: Migrate LOGISTICA rows to DEPOSITO (before removing the enum value)
UPDATE usuarios SET rol = 'ENCARGADO_DEPOSITO' WHERE rol = 'LOGISTICA';
UPDATE empleados SET rol = 'ENCARGADO_DEPOSITO' WHERE rol = 'LOGISTICA';

-- Step 2: Rename enum values (PostgreSQL 10+)
ALTER TYPE rol RENAME VALUE 'ENCARGADO' TO 'SUPERVISOR';
ALTER TYPE rol RENAME VALUE 'ENCARGADO_DE_CALLE' TO 'JEFE_VENTAS';
ALTER TYPE rol RENAME VALUE 'ENCARGADO_DEPOSITO' TO 'DEPOSITO';

-- Step 3: Remove LOGISTICA by recreating the enum
-- PostgreSQL cannot remove an enum value directly, so we create a new type
CREATE TYPE rol_new AS ENUM (
  'ADMIN',
  'SUPERVISOR',
  'JEFE_VENTAS',
  'VENDEDOR',
  'VENDEDOR_CALLE',
  'DEPOSITO',
  'FINANZAS',
  'REPARTIDOR'
);

ALTER TABLE usuarios ALTER COLUMN rol TYPE rol_new USING rol::text::rol_new;
ALTER TABLE empleados ALTER COLUMN rol TYPE rol_new USING rol::text::rol_new;

DROP TYPE rol;
ALTER TYPE rol_new RENAME TO rol;

-- Step 4: Create permission_overrides table for hybrid permission system
CREATE TABLE permission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rol rol NOT NULL,
  permission VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rol, permission, usuario_id)
);

CREATE INDEX idx_permission_overrides_usuario ON permission_overrides(usuario_id);
CREATE INDEX idx_permission_overrides_rol ON permission_overrides(rol);
