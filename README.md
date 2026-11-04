# TVT Cloud Ecosystem Master

Master production Docker Compose orchestration, Nginx reverse proxy gateway, and automated VPS deployment for the complete TVT Agency microservices ecosystem at `api.tvtagency.com`.

## Architecture

```
                       [Internet / Clients]
                                |
                                v  (HTTPS / Cloudflare SSL)
           +------------------------------------------+
           |   NGINX REVERSE PROXY GATEWAY (80/443)   |
           |          api.tvtagency.com                |
           |          Memory: 100M                     |
           +--------------------+---------------------+
                                |  (Docker Network: tvt-net)
     +------------------+-------+----------+------------------+
     v                  v                  v                  v
[/scanner/*]       [/billing/*]       [/concierge/*]     [/review/*]
Scanner Engine     VietQR Webhook     Smart Concierge    Review Booster
Port 3000          Port 3001          Port 3002          Port 3003
Max 800M RAM       Max 250M RAM       Max 350M RAM       Max 200M RAM
     |                  |                  |                  |
     +------------------+--------+---------+------------------+
                                 v
                     [REDIS 7 CACHE & QUEUE]
                        Port 6379 / 150M
```

**Total memory envelope: ~1.85GB** (safe for VPS 16GB)

## Services

| Service | Image / Build | Internal Port | Path | Memory Limit |
|---------|--------------|---------------|------|-------------|
| `gateway` | `nginx:1.25-alpine` | 80, 443 | `/` | 100M |
| `scanner` | `tvt-web-scanner-60s` | 3000 | `/scanner/` | 800M |
| `billing` | `tvt-vietqr-auto-billing` | 3001 | `/billing/` | 250M |
| `concierge` | `tvt-smart-concierge-rag` | 3002 | `/concierge/` | 350M |
| `review` | `tvt-review-booster` | 3003 | `/review/` | 200M |
| `redis` | `redis:7-alpine` | 6379 | internal | 150M |

## 1-Click VPS Deployment

### Prerequisites
- Docker Engine 24+ and Docker Compose v2 installed
- Git installed on target VPS (`187.77.157.54`)

### Deploy

```bash
git clone https://github.com/tvt-ai-max/tvt-cloud-ecosystem-master.git /opt/tvt-cloud-ecosystem
cd /opt/tvt-cloud-ecosystem
```

```bash
cp .env.production.example .env.production
# Edit .env.production with your actual API keys and secrets
```

```bash
docker compose up -d --build
```

Or use the automated deploy script:

```bash
bash scripts/deploy-vps.sh
```

### Health Check

```bash
bash scripts/healthcheck-all.sh
```

### Backup Data

```bash
bash scripts/backup-data.sh
```

## cURL Verification Commands

```bash
curl -s https://api.tvtagency.com/health | jq .
```

```bash
curl -s https://api.tvtagency.com/scanner/health | jq .
```

```bash
curl -s https://api.tvtagency.com/billing/health | jq .
```

```bash
curl -s https://api.tvtagency.com/concierge/health | jq .
```

```bash
curl -s https://api.tvtagency.com/review/health | jq .
```

## File Structure

```
tvt-cloud-ecosystem-master/
├── docker-compose.yml              # Master compose - all 6 containers
├── .env.production.example         # Environment variables template
├── nginx/
│   ├── nginx.conf                  # Nginx master config (gzip, buffers, Cloudflare)
│   └── conf.d/
│       └── api.tvtagency.com.conf  # Reverse proxy routing & security headers
├── scripts/
│   ├── deploy-vps.sh               # Automated VPS deployment
│   ├── healthcheck-all.sh          # Service health polling
│   └── backup-data.sh              # Volume backup with retention
└── tests/
    ├── docker-compose.test.js      # Compose YAML, services, memory, networks
    ├── nginx-routing.test.js       # Nginx config, locations, headers
    ├── scripts-syntax.test.js      # Bash scripts validation
    └── env-contract.test.js        # Required environment keys
```

## Testing

```bash
npm install
```

```bash
npm test
```

All 59 tests must pass with 0 failures before deployment.

## License

MIT
