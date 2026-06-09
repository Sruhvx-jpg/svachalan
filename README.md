# tRPC Monorepo Scaffold

A starter monorepo with tRPC, Next.js web apps, a Tauri desktop app, and a shared backend API.

## What’s included

- `apps/api` — Express + tRPC backend service
- `apps/web` — Next.js web frontend
- `apps/tauri-app` — Tauri desktop app with a Next.js UI
- `packages/*` — shared modules for `trpc`, `database`, `logger`, `services`, ESLint, and TypeScript configuration

## Requirements

- Node.js 18 or later
- `pnpm` package manager

## Setup

1. Make the setup script executable and run it to inject environment values where needed:

   ```bash
   chmod +x ./setup.sh
   ./setup.sh
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Configure environment variables, if needed:

   - There is a root `.env` and `.env` files in some workspace packages.
   - Adjust values as needed for your local database, API, or development environment.

## Run the project

### Start everything at once

```bash
pnpm dev
```

This uses Turbo to run the workspace apps in parallel.

### Run a single app

- API:
  ```bash
  pnpm --filter @repo/api dev
  ```

- Web frontend:
  ```bash
  pnpm --filter web dev
  ```

- Tauri app:
  ```bash
  pnpm --filter tauri-app dev
  ```

## Build

- Build all packages and apps:

  ```bash
  pnpm build
  ```

- Build a single app:

  ```bash
  pnpm --filter web build
  pnpm --filter tauri-app build
  pnpm --filter @repo/api build
  ```

## Useful commands

- Lint the repo:
  ```bash
  pnpm lint
  ```

- Format files:
  ```bash
  pnpm format
  ```

- Check TypeScript types:
  ```bash
  pnpm check-types
  ```

## Notes

- The repo uses Turborepo for workspace orchestration.
- Shared `@repo/*` packages are consumed by the apps in `apps/`.

## Deployment

### Local Development
```bash
pnpm dev  # Runs API, Web, and Redis in development mode
```

### VPS / Production
⚠️ **Important**: The Tauri desktop app only runs locally. For VPS deployment:

1. **Use Docker Compose** (recommended):
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Manual deployment**:
   - API runs on port 4000
   - Web frontend (tauri-app's Next.js) runs on port 300
   - Redis runs on port 6379

See [VPS_DEPLOYMENT.md](./VPS_DEPLOYMENT.md) for full deployment instructions.
- If you need to inspect app entry points, see:
  - `apps/api/src/index.ts`
  - `apps/web/app/page.tsx`
  - `apps/tauri-app/app/page.tsx`
