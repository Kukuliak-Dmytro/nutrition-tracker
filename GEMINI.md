# Nutrition Tracker — Architecture, Server & Deployment Guidelines

This project is a modern Next.js 15 web application with Prisma ORM and PostgreSQL for personal nutrition and meal tracking.
Detailed server and deployment documentation is available in:
- [`.agent/rules/deployment-and-server.md`](.agent/rules/deployment-and-server.md)

---

## Production, Infrastructure & Deployment Context

- **Target Production URL**: `https://nutrition.dvkplay.com` (subdomain hosted on Cloudflare).
- **GitHub Repository**: [https://github.com/Kukuliak-Dmytro/nutrition-tracker](https://github.com/Kukuliak-Dmytro/nutrition-tracker)
- **Host Server (Mini PC)**:
  - Shared physical Ubuntu Mini PC host (also hosts `vechornytsi`).
  - SSH access: `ssh minipc` (user `setup`, LAN IP `192.168.0.103`).
  - Project directory on server: `/home/setup/projects/nutrition-tracker`.
  - Node.js runtime: Managed by NVM (`source ~/.nvm/nvm.sh` before node/npm commands via SSH).
- **Port Allocation & Conflict Prevention**:
  - `vechornytsi` already occupies ports `3000` (app) and `5432` (db).
  - **`nutrition-tracker` MUST strictly use:**
    - App Web Port: `3001` (`127.0.0.1:3001:3000`)
    - PostgreSQL Port: `5433` (`127.0.0.1:5433:5432`)
    - Container names: `nutrition_tracker_app`, `nutrition_tracker_db`.
- **Cloudflare Routing & Subdomain**:
  - The server runs `cloudflared.service` (token at `/etc/cloudflared/token`).
  - In Cloudflare Zero Trust: configure Public Hostname `nutrition.dvkplay.com` $\rightarrow$ `http://localhost:3001`.
- **Git & Branching Strategy**:
  - `dev`: Active development branch for new features and bug fixes.
  - `main`: Production branch. Merged from `dev`. Pushing to `main` triggers automated CI/CD.
  - Always verify with `npm run lint && npm run typecheck` before merging into `main`.
- **CI/CD Pipeline (`.github/workflows/deploy.yml`)**:
  - **Stage 1 (`verify`)**: Runs on `ubuntu-latest` (`npm ci`, `npx prisma generate`, `npm run lint`, `npm run typecheck`).
  - **Stage 2 (`deploy`)**: Runs on `[self-hosted, minipc-nutrition]` with `needs: [verify]`. If Stage 1 fails, deployment NEVER runs.
- **Key Operations Commands**:
  - Check containers: `ssh minipc "docker ps --filter name=nutrition"`
  - Container logs: `ssh minipc "cd projects/nutrition-tracker && docker compose logs -f --tail 50 app"`
  - Run migrations on server: `ssh minipc "cd projects/nutrition-tracker && docker compose exec -T app npx prisma migrate deploy"`
  - Check runner status: `ssh minipc "systemctl status actions.runner.*nutrition*"`

---

## Engineering Principles: Simplicity & Minimal Solutions

1. **Simplicity Over Overengineering (KISS & YAGNI)**:
   - Solve the immediate requirement directly without speculative abstractions or redundant wrapper layers.
   - Choose straightforward, readable code over clever type gymnastics or premature optimizations.

2. **No Legacy Compatibility (Unless Explicitly Requested)**:
   - Do not retain backward compatibility for obsolete, refactored, or superseded code unless the user explicitly asks for it.
   - Delete dead code, unused functions, obsolete fallbacks, and deprecated types completely.

3. **Minimal Working Solution (MWS)**:
   - Implement the smallest, cleanest blast-radius change that fully satisfies the task and passes verification.
   - Avoid introducing new dependencies or touching unrelated files.
