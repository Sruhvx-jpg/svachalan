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

## Production Nginx Reverse Proxy Config
```nginx
upstream api {
    server localhost:4000;
}

upstream web {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # API proxy
    location /api {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Web proxy
    location / {
        proxy_pass http://web;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

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
