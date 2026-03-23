CREATE TABLE api_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    api_key VARCHAR(100) NOT NULL UNIQUE,
    api_secret_hash VARCHAR(200) NOT NULL,
    cors_origins TEXT[] DEFAULT '{}',
    activo BOOLEAN NOT NULL DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_api_clients_key ON api_clients(api_key) WHERE activo = true;
