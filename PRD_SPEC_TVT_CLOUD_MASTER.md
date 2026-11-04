# PRODUCT REQUIREMENT DOCUMENT (PRD) & SPECIFICATION
## TVT Cloud Ecosystem Master — Production Orchestration & Gateway

**Organization**: TVT Agency (`tvtagency.com` / `toilatung.com`)  
**Project**: `tvt-cloud-ecosystem-master`  
**Architecture Lead**: Nguyễn Thanh Tùng (Founder)  
**Operations Lead**: Lexi AI (Senior Operations Manager)  
**Target Repository**: `https://github.com/tvt-ai-max/tvt-cloud-ecosystem-master`  
**Target Server**: KVM VPS `187.77.157.54` (HestiaCP + Docker Engine)  
**Unified API Domain**: `https://api.tvtagency.com`

---

## 1. MỤC TIÊU SẢN PHẨM (MISSION & GOALS)
- Đóng vai trò là **Bộ chỉ huy điều phối tối cao (Master Orchestrator)** cho toàn bộ hệ sinh thái Microservices của TVT Agency.
- Tích hợp 4 microservices độc lập đã xây dựng vào một cụm mạng nội bộ (`tvt-net`) quản lý bằng **Docker Compose**:
  1. `tvt-web-scanner-60s` (Port `3000` $\rightarrow$ `/scanner/*`)
  2. `tvt-vietqr-auto-billing` (Port `3001` $\rightarrow$ `/billing/*`)
  3. `tvt-smart-concierge-rag` (Port `3002` $\rightarrow$ `/concierge/*`)
  4. `tvt-review-booster` (Port `3003` $\rightarrow$ `/review/*`)
  5. `redis` (Port `6379`, Redis 7 Alpine)
  6. `gateway` (Nginx Reverse Proxy điều phối domain `api.tvtagency.com`)
- Cung cấp trọn bộ **Scripts vận hành 1-click** (Deploy, Healthcheck, Backup) và khóa giới hạn RAM máy chủ không bao giờ vượt quá **2.5GB**.

---

## 2. KIẾN TRÚC ĐIỀU PHỐI (UNIFIED ARCHITECTURE)

```
                       [Internet / Clients]
                                │
                                ▼ (HTTPS / Cloudflare SSL)
           ┌──────────────────────────────────────────┐
           │   NGINX REVERSE PROXY GATEWAY (Port 443)  │
           │          api.tvtagency.com               │
           └────────────────────┬─────────────────────┘
                                │ (Internal Docker Network: tvt-net)
     ┌──────────────────┬───────┴──────────┬──────────────────┐
     ▼                  ▼                  ▼                  ▼
[/scanner/*]       [/billing/*]       [/concierge/*]     [/review/*]
Scanner Engine     VietQR Webhook     Smart Concierge    Review Booster
Port 3000          Port 3001          Port 3002          Port 3003
(Max 800MB RAM)    (Max 250MB RAM)    (Max 350MB RAM)    (Max 200MB RAM)
     │                  │                  │                  │
     └──────────────────┴────────┬─────────┴──────────────────┘
                                 ▼
                     [REDIS 7 CACHE & QUEUE]
                           Port 6379
```

---

## 3. CẤU TRÚC TỆP TIN DỰ ÁN (FILE STRUCTURE)

```
tvt-cloud-ecosystem-master/
├── PRD_SPEC_TVT_CLOUD_MASTER.md
├── CLAUDE.md
├── README.md
├── package.json
├── docker-compose.yml              # Master compose defining all 6 containers
├── .env.production.example         # Unified environment variables template
├── nginx/
│   ├── nginx.conf                  # Master Nginx configuration
│   └── conf.d/
│       └── api.tvtagency.com.conf  # Reverse proxy location blocks & headers
├── scripts/
│   ├── deploy-vps.sh               # 1-Click deploy script for VPS 187.77.157.54
│   ├── healthcheck-all.sh          # Concurrent status check for all services
│   └── backup-data.sh              # Backup PDFs, feedback data, knowledge base
└── tests/
    ├── docker-compose.test.js      # Validates YAML schema, memory limits, ports
    ├── nginx-routing.test.js       # Validates Nginx proxy_pass rules & SSL headers
    ├── scripts-syntax.test.js      # Validates bash scripts formatting & error exits
    └── env-contract.test.js        # Validates all required service environment keys
```

---

## 4. TIÊU CHUẨN KỸ THUẬT & RESOURCE LIMITS
- **Giới hạn tài nguyên (Resource Constraints)**:
  - Scanner: `deploy.resources.limits.memory: 800M`
  - Billing: `deploy.resources.limits.memory: 250M`
  - Concierge: `deploy.resources.limits.memory: 350M`
  - Review Booster: `deploy.resources.limits.memory: 200M`
  - Redis: `deploy.resources.limits.memory: 150M`
  - Nginx Gateway: `deploy.resources.limits.memory: 100M`
  - $\Sigma$ RAM tối đa: **~ 1.85GB** (An toàn tuyệt đối cho VPS 16GB).
- **Restart Policy**: `restart: unless-stopped` trên toàn bộ container.
- **Nginx Security**: HSTS headers, X-Frame-Options, X-Content-Type-Options, Cloudflare Real IP restore (`CF-Connecting-IP`).
- **Tests**: 100% tests pass bằng `node --test tests/*.test.js`.
