#!/bin/bash
# Pronto ERP - Database Backup Script
# Usage: ./scripts/backup.sh [output_dir]
#
# Environment variables:
#   DATABASE_URL - PostgreSQL connection string (required)
#   BACKUP_RETENTION_DAYS - Number of days to keep backups (default: 30)
#
# Recommended: Run via cron every 6 hours
#   0 */6 * * * /path/to/pronto/scripts/backup.sh /path/to/backups

set -euo pipefail

BACKUP_DIR="${1:-./backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/pronto_backup_${TIMESTAMP}.sql.gz"

# Load .env if exists
if [ -f "apps/api/.env" ]; then
  export $(grep -v '^#' apps/api/.env | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL environment variable is not set"
  exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# Run pg_dump and compress
pg_dump "$DATABASE_URL" \
  --format=plain \
  --no-owner \
  --no-privileges \
  --verbose \
  2>"${BACKUP_DIR}/backup_${TIMESTAMP}.log" \
  | gzip > "$BACKUP_FILE"

BACKUP_SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] Backup completed: $BACKUP_FILE ($BACKUP_SIZE)"

# Clean up old backups
if [ "$RETENTION_DAYS" -gt 0 ]; then
  DELETED=$(find "$BACKUP_DIR" -name "pronto_backup_*.sql.gz" -mtime +"$RETENTION_DAYS" -delete -print | wc -l)
  find "$BACKUP_DIR" -name "backup_*.log" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true
  if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] Cleaned up $DELETED old backup(s) (older than $RETENTION_DAYS days)"
  fi
fi

echo "[$(date)] Backup complete."
