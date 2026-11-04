# CLAUDE.md — TVT Cloud Ecosystem Master

## Project Overview
This repository contains the Master Production Docker Compose orchestration, Nginx reverse proxy gateway, and automated VPS deployment scripts for the complete TVT Agency microservices ecosystem (`api.tvtagency.com` hosted on KVM VPS `187.77.157.54`).

## Orchestrated Services
1. `scanner`: `https://github.com/tvt-ai-max/tvt-web-scanner-60s` (Node.js/Puppeteer on port 3000 -> `/scanner/`)
2. `billing`: `https://github.com/tvt-ai-max/tvt-vietqr-auto-billing` (Standalone webhook on port 3001 -> `/billing/`)
3. `concierge`: `https://github.com/tvt-ai-max/tvt-smart-concierge-rag` (AI Concierge on port 3002 -> `/concierge/`)
4. `review`: `https://github.com/tvt-ai-max/tvt-review-booster` (Review Booster on port 3003 -> `/review/`)
5. `redis`: Redis 7 Alpine on internal port 6379
6. `gateway`: Nginx Alpine reverse proxy on ports 80/443

## Implementation Checklist
1. `docker-compose.yml`:
   - All 6 services defined on network `tvt-net`.
   - Healthcheck for every service.
   - Strict memory limits (Total < 2GB RAM).
   - Volumes for data persistence (`scanner-pdfs`, `review-data`, `redis-data`).
2. `nginx/`:
   - `nginx/nginx.conf`: Worker processes, gzip, buffers.
   - `nginx/conf.d/api.tvtagency.com.conf`: Unified gateway routing:
     * `location /scanner/` -> `proxy_pass http://scanner:3000/;`
     * `location /billing/` -> `proxy_pass http://billing:3001/;`
     * `location /concierge/` -> `proxy_pass http://concierge:3002/;`
     * `location /review/` -> `proxy_pass http://review:3003/;`
     * WebSocket upgrade headers and Cloudflare Real-IP support.
3. `.env.production.example`:
   - Unified environment variables for all microservices with secure placeholders.
4. `scripts/`:
   - `scripts/deploy-vps.sh`: SSH automated deployer (git clone/pull submodules or compose build, reload).
   - `scripts/healthcheck-all.sh`: Concurrent curl to all 4 health endpoints + Redis ping.
   - `scripts/backup-data.sh`: Tarball backup of persistent data directories.
5. `tests/`:
   - `tests/docker-compose.test.js`: Validates compose YAML syntax, services list, memory limits, and networks.
   - `tests/nginx-routing.test.js`: Validates Nginx conf syntax, location blocks, and proxy headers.
   - `tests/scripts-syntax.test.js`: Validates bash scripts formatting, shebangs, and set -e.
   - `tests/env-contract.test.js`: Validates required environment variable keys.

## Verification Command
```bash
npm test
```
All tests must pass with 0 failures before pushing.
