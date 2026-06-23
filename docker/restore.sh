#!/bin/bash
# HSE Pro Enterprise - PostgreSQL Restore Script
set -e

BACKUP_FILE="$1"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file.sql.gz>"
  echo ""
  echo "Available backups:"
  ls -lh "${BACKUP_DIR:-/backups}"/*.sql.gz 2>/dev/null || echo "  (none)"
  exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] WARNING: This will restore from ${BACKUP_FILE}"
echo "[$(date)] All current data will be replaced."
read -p "Continue? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "Restore cancelled."
  exit 0
fi

echo "[$(date)] Starting restore from: ${BACKUP_FILE}"
gunzip -c "$BACKUP_FILE" | psql "${DATABASE_URL}"
echo "[$(date)] Restore completed successfully"
