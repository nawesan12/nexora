-- Organization (empresa) as the tenant unit
-- Currently usuario_id is used for tenant isolation.
-- This migration adds an organizacion_id concept so multiple users can share data.

CREATE TABLE organizaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(300) NOT NULL,
    cuit VARCHAR(20),
    plan VARCHAR(30) NOT NULL DEFAULT 'BASICO',
    activa BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Link users to organizations
ALTER TABLE usuarios ADD COLUMN organizacion_id UUID REFERENCES organizaciones(id);
CREATE INDEX idx_usuarios_organizacion ON usuarios(organizacion_id);

-- For existing data: each user becomes their own organization
-- (migration script would create one org per user and link them)
-- This is a data migration that should be run separately:
-- INSERT INTO organizaciones (id, nombre) SELECT id, email FROM usuarios;
-- UPDATE usuarios SET organizacion_id = id;

-- Note: The actual tenant isolation migration (changing all usuario_id FK to organizacion_id)
-- is a massive refactor affecting 50+ tables. This migration just adds the foundation.
-- Phase 2 of multi-tenancy would:
-- 1. Add organizacion_id to all business tables
-- 2. Update all queries to filter by organizacion_id instead of usuario_id
-- 3. Update middleware to inject organizacion_id from the authenticated user
-- For now, usuario_id continues to work as the tenant key, and organizacion_id
-- enables the future migration path.
