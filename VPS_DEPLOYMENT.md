# VPS Deployment Guide - Svachalan

## Architecture
- **API Service**: Runs in Docker on port 4000
- **Web Frontend**: Runs in Docker on port 3000
- **Redis Cache**: Runs in Docker on port 6379
- **Tauri App**: Desktop app (runs locally on user machines)

## Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (optional, for manual deployment)
- pnpm (optional, for manual deployment)

## Deployment Steps

### 1. Clone & Setup
```bash
git clone <repo-url>
cd Svachalan
```

### 2. Environment Variables
```bash
# Copy and configure .env file
cp .env .env.production
# Edit .env.production with your production values
```

### 3. Deploy with Docker Compose (Recommended)
```bash
# For production (with both API and Web)
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f api
docker-compose -f docker-compose.prod.yml logs -f web
```

### 4. Manual Deployment (if not using Docker)

#### Start API
```bash
pnpm install
pnpm build
pnpm --filter @repo/api start
```

#### Start Web (in separate terminal)
```bash
pnpm install
pnpm --filter tauri-app build
pnpm --filter tauri-app start --port 3000
```

#### Start Redis (requires Redis installed)
```bash
redis-server
```

## Access Services
- **API**: http://your-vps-ip:4000
- **Web**: http://your-vps-ip:3000
- **API Health**: http://your-vps-ip:4000/health
- **API Docs**: http://your-vps-ip:4000/docs

## Production Caddy Reverse Proxy Config

Caddy automatically provisions and renews TLS certificates via Let's Encrypt
and forwards `X-Forwarded-For`, `X-Forwarded-Proto`, and `X-Forwarded-Host` headers.

```caddyfile
api.svachalan.space {
    reverse_proxy localhost:4000
}

app.svachalan.space {
    reverse_proxy localhost:3001
}

supermemory.svachalanspace {
    reverse_proxy localhost:6767
}
```

> **Note:** The web container maps internal port 3000 → host port 3001 (see `docker-compose.prod.yml`).
> Caddy handles HTTPS termination and header forwarding automatically.

## Stopping Services
```bash
docker-compose -f docker-compose.prod.yml down
```

## Important Notes
⚠️ **Tauri App**: The Tauri desktop app ONLY runs on user machines locally. It's not meant for VPS deployment.
- Users run: `pnpm tauri:dev` or built Tauri binary locally
- Web app: Runs on VPS on port 3000 for browser access

## Troubleshooting

### API Module Not Found
Ensure `tsx` is used in the start script (already fixed):
```json
"start": "tsx dist/index.js"
```

### Port Already in Use
```bash
# Change ports in docker-compose.prod.yml or:
lsof -i :4000  # Find process using port 4000
kill -9 <PID>
```

### Database Connection Issues
- Verify DATABASE_URL in .env.production
- Ensure database is accessible from VPS
- Check credentials

## Deployment with PM2 (Alternative)
```bash
npm install -g pm2

# Create ecosystem.config.js
pm2 start ecosystem.config.js

# View logs
pm2 logs
```
