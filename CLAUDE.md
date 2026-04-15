# SEOCrawler-WEB Context

## Project Overview

Cloudflare Pages application for multi-user SEO audits. Built with Hono + React + D1 + R2.

## Quick Start

```bash
cd seocrawler-web
npm install
# Configure wrangler.jsonc with D1/R2 IDs
wrangler d1 create seocrawler-db
wrangler d1 execute seocrawler-db --file=./migrations/0000_initial.sql
npm run build
wrangler pages deploy
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev server |
| `npm run build` | Build React UI |
| `wrangler pages deploy` | Deploy to Cloudflare |

## Important Files

- `wrangler.jsonc` - Cloudflare config
- `functions/api/[[path]].ts` - API endpoints
- `src/pages/Admin.tsx` - Settings & user management  
- `migrations/0000_initial.sql` - Database schema
- `src/lib/render-seo-report.ts` - HTML renderer

## Important Notes

1. D1 database must exist before applying migration
2. R2 bucket must be created first
3. JWT SECRET must be set via `wrangler secret put SECRET`
4. Settings managed via `/admin` page - stored in D1 settings table

## Tech Stack

- Hono (API)
- React 18 (UI)
- shadcn/ui
- Cloudflare D1
- Cloudflare R2
- Tailwind CSS