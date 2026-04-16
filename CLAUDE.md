# SEOCrawler-WEB Context

## Quick Start

```bash
cd seocrawler-web
npm install
npm run build:frontend
npm run deploy
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev |
| `npm run build:frontend` | Build UI |
| `npm run deploy` | Deploy Worker to Cloudflare |

## Deployments

- Frontend: https://seocrawler-web.pages.dev (Cloudflare Pages)
- API: https://seocrawler-web.curtislamasters.workers.dev (Cloudflare Workers)

## Auto-Deploy

GitHub Actions workflow (`.github/workflows/deploy.yml`) auto-deploys on push to master.

## Important Files

- `wrangler.toml` - Cloudflare Worker config
- `src/db/schema.ts` - Database schema
- `src/worker.ts` - Worker API
- `drizzle.config.ts` - Drizzle config

## Tech Stack

- Hono (API in Cloudflare Workers)
- Drizzle ORM + D1 (SQLite)
- React + Vite (Frontend)
- Cloudflare R2 (File storage)

## API Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me
- GET/POST /api/reports
- GET/POST /api/admin/*

## D1 Database

- Database: seocrawler-db (35f3b153-fb3b-4d7d-8ad3-87e98044a969)
- Run migrations: `npx wrangler d1 execute seocrawler-db --file=src/db/migrations/0000_eminent_darkstar.sql --remote`