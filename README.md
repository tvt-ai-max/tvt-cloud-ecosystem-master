# TVT Cloud Ecosystem Master

Master production Docker Compose orchestration, Nginx reverse proxy gateway, and VPS deployment automation for the TVT Agency microservices ecosystem.

## Architecture
- **Unified Domain**: `https://api.tvtagency.com`
- **Reverse Proxy Gateway**: Nginx Alpine routing requests to internal containers.
- **Microservices Cluster**:
  - `scanner`: TVT Web Scanner 60s (`:3000` -> `/scanner/`)
  - `billing`: TVT VietQR Auto-Billing Webhook (`:3001` -> `/billing/`)
  - `concierge`: TVT Smart Concierge RAG (`:3002` -> `/concierge/`)
  - `review`: TVT Review Booster (`:3003` -> `/review/`)
  - `redis`: Redis 7 Alpine (`:6379`)
- **Total Memory Envelope**: < 1.85GB RAM capped.

## Deployment
```bash
cp .env.production.example .env.production
docker compose up -d --build
bash scripts/healthcheck-all.sh
```

## Testing
```bash
npm install
npm test
```
