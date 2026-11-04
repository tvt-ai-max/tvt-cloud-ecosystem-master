#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# TVT Cloud Ecosystem — Automated VPS Deployment
# Target: KVM VPS 187.77.157.54 (HestiaCP + Docker Engine)
# ============================================================

DEPLOY_DIR="/opt/tvt-cloud-ecosystem"
REPO_URL="https://github.com/tvt-ai-max/tvt-cloud-ecosystem-master.git"
BRANCH="main"
COMPOSE_FILE="docker-compose.yml"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

log "Starting TVT Cloud Ecosystem deployment..."

if [ ! -d "$DEPLOY_DIR" ]; then
    log "Cloning repository to $DEPLOY_DIR..."
    git clone --depth 1 --branch "$BRANCH" "$REPO_URL" "$DEPLOY_DIR"
else
    log "Pulling latest changes..."
    cd "$DEPLOY_DIR"
    git fetch origin "$BRANCH"
    git reset --hard "origin/$BRANCH"
fi

cd "$DEPLOY_DIR"

if [ ! -f ".env.production" ]; then
    log "ERROR: .env.production not found. Copy from .env.production.example and fill in values."
    log "  cp .env.production.example .env.production"
    exit 1
fi

log "Building and starting containers..."
docker compose -f "$COMPOSE_FILE" pull redis
docker compose -f "$COMPOSE_FILE" build --parallel
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

log "Waiting for services to become healthy..."
sleep 10

log "Running healthcheck..."
bash scripts/healthcheck-all.sh

log "Reloading Nginx gateway gracefully..."
docker compose exec gateway nginx -s reload 2>/dev/null || true

log "Deployment complete!"
docker compose ps
