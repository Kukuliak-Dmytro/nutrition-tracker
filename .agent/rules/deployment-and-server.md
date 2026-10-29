# Deployment, Server & Subdomain Guidelines for dvkTrack (Nutrition Tracker)

This guide defines the deployment architecture, host server configuration, CI/CD pipeline, and subdomain routing for `nutrition-tracker` running on the shared Mini PC host within the DVK Powered ecosystem.

---

## 1. Project URLs & Repository

- **Target Production URL / Subdomain**: `https://track.dvkpowered.org`
- **GitHub Repository**: [https://github.com/Kukuliak-Dmytro/nutrition-tracker](https://github.com/Kukuliak-Dmytro/nutrition-tracker)
  - SSH Git: `git@github.com:Kukuliak-Dmytro/nutrition-tracker.git`
- **Umbrella Hub**: [https://dvkpowered.org](https://dvkpowered.org)
- **Primary Tech Stack**: Next.js 15, Prisma ORM, PostgreSQL 16, TailwindCSS, next-intl.

---

## 2. Shared Server Environment (Mini PC)

The application runs on the same physical Mini PC server as `vechornytsi`.

- **SSH Alias**: `minipc` (configured in `~/.ssh/config` using identity file `~/.ssh/minipc_key`).
- **Connection Command**:
  ```bash
  ssh minipc
  ```
- **User**: `setup`
- **LAN IP**: `192.168.0.103`
- **Project Directory on Server**: `/home/setup/projects/nutrition-tracker`
- **Node.js Runtime on Host**: Managed via NVM (`~/.nvm/versions/node/v24.20.0/bin/node`).
  When executing non-interactive bash commands via SSH, source NVM first:
  ```bash
  ssh minipc "source ~/.nvm/nvm.sh && cd /home/setup/projects/nutrition-tracker && ..."
  ```

---

## 3. Port Allocation & Collision Prevention

> [!CRITICAL]
> **Port Sharing Rules with Vechornytsi**:
> - `vechornytsi_app` is bound to host port `3000`.
> - `vechornytsi_pgvector` is bound to host port `5432`.
> 
> **Nutrition Tracker MUST use non-conflicting host ports:**
> - **App Web Port**: `3001` (Host `127.0.0.1:3001` $\rightarrow$ Container `3000`).
> - **PostgreSQL Database Port**: `5433` (Host `127.0.0.1:5433` $\rightarrow$ Container `5432`).
> - **Docker Container Names**: `nutrition_tracker_app`, `nutrition_tracker_db`.

---

## 4. Subdomain Routing via Cloudflare Tunnel & Nginx

Public traffic to `https://track.dvkpowered.org` is secured and routed through Cloudflare:

### Option A: Cloudflare Zero Trust Tunnel Direct Route (Recommended & Simplest)
1. The host already runs `cloudflared.service` with token `/etc/cloudflared/token`.
2. In the **Cloudflare Zero Trust Dashboard** $\rightarrow$ **Networks** $\rightarrow$ **Tunnels** $\rightarrow$ select active tunnel $\rightarrow$ **Public Hostname**:
   - **Subdomain**: `track`
   - **Domain**: `dvkpowered.org`
   - **Service Type**: `HTTP`
   - **URL**: `localhost:3001`
3. Traffic goes directly to the Next.js container on port `3001` without needing extra SSL certificates on the host.

### Option B: Host Nginx Reverse Proxy Route
If routing through host Nginx:
Create `/etc/nginx/sites-available/nutrition-tracker`:
```nginx
server {
    listen 80;
    server_name track.dvkpowered.org;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable and reload:
```bash
sudo ln -s /etc/nginx/sites-available/nutrition-tracker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Dockerized Production Setup

### A. Next.js Configuration (`next.config.ts`)
Add `output: 'standalone'` so Docker builds are lightweight (~150MB instead of ~1GB):
```typescript
import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
};

export default withNextIntl(nextConfig);
```

### B. Production `Dockerfile`
A multi-stage Dockerfile optimized for Next.js and Prisma:
```dockerfile
# 1. Dependencies Stage
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json yarn.lock ./
COPY prisma ./prisma/
RUN yarn install --frozen-lockfile

# 2. Build Stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js in standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN yarn build

# 3. Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy standalone build
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
```

### C. Production `docker-compose.yml`
```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: nutrition_tracker_db
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-nutrition_user}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-nutrition_password}
      POSTGRES_DB: ${POSTGRES_DB:-nutrition_tracker}
    ports:
      - "127.0.0.1:5433:5432"
    volumes:
      - nutrition_postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U nutrition_user -d nutrition_tracker"]
      interval: 5s
      timeout: 5s
      retries: 5
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: nutrition_tracker_app
    restart: unless-stopped
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "127.0.0.1:3001:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      HOSTNAME: "0.0.0.0"
      DATABASE_URL: postgresql://nutrition_user:nutrition_password@postgres:5432/nutrition_tracker?schema=public
      DIRECT_URL: postgresql://nutrition_user:nutrition_password@postgres:5432/nutrition_tracker?schema=public
      NEXT_PUBLIC_APP_URL: ${NEXT_PUBLIC_APP_URL:-https://track.dvkpowered.org}
    env_file:
      - path: .env
        required: false
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  nutrition_postgres_data:
```

---

## 6. Self-Hosted GitHub Runner Setup on Mini PC

Because GitHub Actions runners are scoped per repository or organization, a second runner instance is configured on the Mini PC for `nutrition-tracker`:

```bash
# 1. SSH into the server
ssh minipc

# 2. Create runner directory
mkdir -p /home/setup/projects/actions-runner-nutrition
cd /home/setup/projects/actions-runner-nutrition

# 3. Download GitHub Actions runner package (Linux x64)
curl -o actions-runner-linux-x64.tar.gz -L https://github.com/actions/runner/releases/download/v2.337.0/actions-runner-linux-x64-2.337.0.tar.gz
tar xzf ./actions-runner-linux-x64.tar.gz

# 4. Get registration token from:
# https://github.com/Kukuliak-Dmytro/nutrition-tracker/settings/actions/runners/new
./config.sh --url https://github.com/Kukuliak-Dmytro/nutrition-tracker --token <RUNNER_REGISTRATION_TOKEN> --name minipc-nutrition --labels self-hosted,minipc-nutrition --unattended

# 5. Install and start as systemd service
sudo ./svc.sh install setup
sudo ./svc.sh start
sudo ./svc.sh status
```

---

## 7. Sequential CI/CD Pipeline (`.github/workflows/deploy.yml`)

Save in `.github/workflows/deploy.yml`:

```yaml
name: CI/CD Pipeline & Deploy to Mini PC

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: nutrition-tracker-deploy
  cancel-in-progress: false

jobs:
  # ============================================================================
  # Stage 1: Quality Checks (Runs on GitHub-hosted ubuntu-latest)
  # ============================================================================
  verify:
    name: Lint & Type-Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: "yarn"

      - name: Install dependencies
        run: yarn install --frozen-lockfile

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Lint
        run: yarn lint

      - name: Type-Check (TypeScript)
        run: yarn typecheck

  # ============================================================================
  # Stage 2: Deploy to Mini PC (Runs ONLY if Stage 1 passes!)
  # ============================================================================
  deploy:
    name: Deploy to Production
    needs: [verify]
    runs-on: [self-hosted, minipc-nutrition]

    steps:
      - name: Pull latest code, migrate DB and rebuild Docker containers
        run: |
          echo "🚀 Starting automated deployment on Mini PC..."
          cd $HOME/projects/nutrition-tracker
          git fetch origin main
          git reset --hard origin/main
          git clean -fd
          
          echo "📦 Running Prisma migrations..."
          docker compose exec -T app npx prisma migrate deploy || true
          
          echo "🐳 Rebuilding containers..."
          docker compose up -d --build
          
          echo "🧹 Pruning unused images..."
          docker image prune -f
          echo "✅ Deployment completed successfully!"
```

---

## 8. Useful Diagnostics & Maintenance Commands

```bash
# Check containers status
ssh minipc "docker ps --filter name=nutrition"

# View app logs
ssh minipc "cd projects/nutrition-tracker && docker compose logs -f --tail 50 app"

# View database logs
ssh minipc "cd projects/nutrition-tracker && docker compose logs -f --tail 50 postgres"

# Run Prisma migrations directly inside container
ssh minipc "cd projects/nutrition-tracker && docker compose exec -T app npx prisma migrate deploy"

# Check runner systemd service
ssh minipc "systemctl status actions.runner.*nutrition*"

# Healthcheck subdomain
curl -Is https://track.dvkpowered.org
```
