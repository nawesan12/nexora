#!/usr/bin/env bash
set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="$ROOT_DIR/apps/api"
WEB_DIR="$ROOT_DIR/apps/web"
PIDS=()

cleanup() {
  echo ""
  echo "Shutting down..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

# 0. Kill stale processes on ports 3000 and 8080
for port in 3000 8080; do
  pids=$(lsof -ti:"$port" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "==> Killing stale processes on port $port (PIDs: $pids)"
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
done

# Clean Next.js lock file if present
rm -f "$WEB_DIR/.next/dev/lock"

# 1. Start Docker (Postgres + Redis)
echo "==> Starting Docker services (Postgres + Redis)..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

echo "==> Waiting for Postgres to be ready..."
until docker exec nexora-postgres pg_isready -U nexora -q 2>/dev/null; do
  sleep 1
done
echo "    Postgres ready."

echo "==> Waiting for Redis to be ready..."
until docker exec nexora-redis redis-cli ping 2>/dev/null | grep -q PONG; do
  sleep 1
done
echo "    Redis ready."

# 2. Run Atlas migrations
if command -v atlas &>/dev/null; then
  echo "==> Running Atlas migrations..."
  (cd "$API_DIR" && atlas migrate apply --env local 2>&1) || echo "    (migrations skipped or already applied)"
else
  echo "==> Atlas not found, skipping migrations."
fi

# 3. Start Go API (export env vars from Docker config)
export DATABASE_URL="postgres://nexora:nexora@localhost:5433/nexora?sslmode=disable"
export REDIS_URL="redis://localhost:6379/0"
export API_PORT=8080
export API_HOST=0.0.0.0
export API_ENV=development
export JWT_SECRET="change-me-in-production"
export JWT_REFRESH_SECRET="change-me-in-production-refresh"
export JWT_EXPIRY=15m
export JWT_REFRESH_EXPIRY=168h
export CORS_ALLOWED_ORIGINS="http://localhost:3000"

echo "==> Starting Go API (port 8080)..."
(cd "$API_DIR" && go run ./cmd/server) &
PIDS+=($!)

# 4. Start Next.js dev server
echo "==> Starting Next.js dev server (port 3000)..."
(cd "$ROOT_DIR" && pnpm --filter @nexora/web dev) &
PIDS+=($!)

echo ""
echo "============================================"
echo "  Nexora dev environment running"
echo "  API:  http://localhost:8080"
echo "  Web:  http://localhost:3000"
echo "  Press Ctrl+C to stop all services"
echo "============================================"
echo ""

# Wait for any child to exit
wait
