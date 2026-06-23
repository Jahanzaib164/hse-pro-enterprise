#!/bin/bash
# HSE Pro Enterprise - PostgreSQL Backup Script
set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
DATE=$(date +%Y%m%d_%H%M%S)
FILENAME="hse_pro_backup_${DATE}.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup: ${FILENAME}"
pg_dump "${DATABASE_URL}" | gzip > "${BACKUP_DIR}/${FILENAME}"

SIZE=$(du -sh "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] Backup completed: ${FILENAME} (${SIZE})"

# Keep last 30 backups
find "$BACKUP_DIR" -name "hse_pro_backup_*.sql.gz" -mtime +30 -delete
echo "[$(date)] Old backups cleaned up"

# List current backups
echo "[$(date)] Current backups:"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "  (none)"
