#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# TVT Cloud Ecosystem — Automated Backup
# Backs up persistent data volumes to timestamped tarballs
# ============================================================

BACKUP_DIR="${BACKUP_DIR:-/opt/tvt-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
COMPOSE_PROJECT="tvt-cloud-ecosystem-master"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

mkdir -p "$BACKUP_DIR"

log "Starting TVT ecosystem backup..."

log "Backing up scanner-pdfs volume..."
docker run --rm \
    -v "${COMPOSE_PROJECT}_scanner-pdfs:/source:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/scanner-pdfs_${TIMESTAMP}.tar.gz" -C /source . 2>/dev/null || \
    log "WARNING: scanner-pdfs volume backup failed (volume may not exist yet)"

log "Backing up review-data volume..."
docker run --rm \
    -v "${COMPOSE_PROJECT}_review-data:/source:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/review-data_${TIMESTAMP}.tar.gz" -C /source . 2>/dev/null || \
    log "WARNING: review-data volume backup failed (volume may not exist yet)"

log "Backing up redis-data volume..."
docker compose exec -T redis redis-cli BGSAVE 2>/dev/null || true
sleep 2
docker run --rm \
    -v "${COMPOSE_PROJECT}_redis-data:/source:ro" \
    -v "$BACKUP_DIR:/backup" \
    alpine tar czf "/backup/redis-data_${TIMESTAMP}.tar.gz" -C /source . 2>/dev/null || \
    log "WARNING: redis-data volume backup failed (volume may not exist yet)"

log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +"$RETENTION_DAYS" -delete 2>/dev/null || true

log "Backup complete! Files in $BACKUP_DIR:"
ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || log "No backup files found."
