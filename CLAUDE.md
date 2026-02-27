# Nexora ERP

> "Operations, simplified." — Full-stack ERP system for distribution companies.

## Architecture

Turborepo monorepo with three layers:

```
nexora/
├── apps/
│   ├── api/         # Go (Chi) REST API server
│   └── web/         # Next.js 16 (App Router, TailwindCSS 4, shadcn/ui)
├── packages/
│   ├── config/      # Shared ESLint, TypeScript, Tailwind configs
│   ├── shared/      # Shared TS types, Zod schemas, constants, utils
│   └── ui/          # Shared UI components (extracted from web)
```

- **Go API** (`apps/api`): Chi v5 router, zerolog logging, envconfig, pgx/v5, go-redis/v9, Atlas migrations, sqlc codegen
- **Web** (`apps/web`): Next.js 16 App Router, TailwindCSS 4, shadcn/ui (new-york), Zustand, TanStack Query
- **Mobile**: Deferred to a later phase

## Quick Commands

```bash
# Root
pnpm install                    # Install all deps
pnpm turbo build                # Build everything
pnpm turbo dev                  # Dev all apps

# Web
pnpm --filter @nexora/web dev   # Next.js dev server (port 3000)
pnpm --filter @nexora/web build # Production build

# API
cd apps/api
cp .env.example .env            # First time setup
make dev                        # Hot reload with air (port 8080)
make build                      # Build binary
make test                       # Run tests
make lint                       # golangci-lint

# Infrastructure
docker compose up -d            # Postgres 16 + Redis 7
docker compose ps               # Check status
```

## Conventions

### Go (apps/api)
- Module: `github.com/nexora-erp/nexora`
- Standard project layout: `cmd/`, `internal/`, `migrations/`, `queries/`
- Config via struct tags: `envconfig:"VAR_NAME"`
- Structured JSON logging: zerolog
- Router: chi/v5 with middleware chain
- All responses use `internal/pkg/response` helpers → `{"success": bool, "data": ..., "error": ...}`
- SQL: sqlc for type-safe queries, Atlas for migrations

### TypeScript (apps/web, packages/*)
- Strict mode, ES2022 target, bundler module resolution
- Path alias: `@/*` → `./src/*` (web only)
- Package imports: `@nexora/shared/constants`, `@nexora/shared/types`
- CSS variables for design tokens (no hardcoded colors)
- Components use `cn()` helper from `@/lib/utils`

### API Response Format
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "pageSize": 20, "total": 100, "totalPages": 5 },
  "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] }
}
```

### Health Check
`GET /api/v1/health` → `{"success": true, "data": {"status": "ok", "version": "0.1.0", "timestamp": "..."}}`

## Design Tokens

Light mode primary: Deep Indigo `#1E1B4B`, Accent: Electric Violet `#7C3AED`.
Dark mode primary: `#A78BFA`, backgrounds: `#0F172A` / `#1E293B`.
Semantic: success `#10B981`, warning `#F59E0B`, error `#EF4444`, info `#3B82F6`.
Fonts: Inter (sans), JetBrains Mono (mono). Radius: 0.5rem.

All tokens are CSS variables in `apps/web/src/app/globals.css`. Use Tailwind utility classes (`bg-primary`, `text-muted-foreground`, etc.).

## Roles (9)

ADMIN, VENDEDOR, ENCARGADO, ENCARGADO_DE_CALLE, ENCARGADO_DEPOSITO, FINANZAS, LOGISTICA, REPARTIDOR, VENDEDOR_CALLE

Defined in `packages/shared/src/constants/roles.ts` with labels and default redirects.

## Order Statuses (16)

Full lifecycle from PENDIENTE_APROBACION through ENTREGADO/CANCELADO/NO_ENTREGADO.
Defined in `packages/shared/src/constants/order-status.ts`.

## Environment Variables

See `.env.example` (root) and `apps/api/.env.example` for all required variables.
Key: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`, `NEXT_PUBLIC_API_URL`.
