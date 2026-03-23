#!/bin/bash
# Pronto ERP - Database Restore Script
# Usage: ./scripts/restore.sh <backup_file>
#
# WARNING: This will DROP and recreate the database!
#
# Environment variables:
#   DATABASE_URL - PostgreSQL connection string (required)

set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh backups/pronto_backup_*.sql.gz 2>/dev/null || echo "  No backups found in ./backups/"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

# Load .env if exists
if [ -f "apps/api/.env" ]; then
  export $(grep -v '^#' apps/api/.env | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

echo "WARNING: This will restore the database from: $BACKUP_FILE"
echo "All current data will be LOST."
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "[$(date)] Starting restore..."

# Decompress and restore
gunzip -c "$BACKUP_FILE" | psql "$DATABASE_URL" --quiet

echo "[$(date)] Restore completed from: $BACKUP_FILE"
