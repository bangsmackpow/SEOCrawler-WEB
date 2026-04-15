# SEOCrawler-WEB Context

## Quick Start

```bash
cd seocrawler-web
npm install
npx drizzle-kit generate
npx drizzle-kit push
npm run deploy
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Local dev |
| `npm run build:frontend` | Build UI |
| `npm run deploy` | Deploy to Cloudflare |

## Important Files

- `wrangler.jsonc` - Cloudflare config
- `src/db/schema.ts` - Database schema
- `src/api/routes/` - API endpoints
- `drizzle.config.ts` - Drizzle config

## Environment Variables

- `JWT_SECRET` - Set in Cloudflare Pages

## Tech Stack

- Hono (API in Pages Functions)
- Drizzle ORM + D1
- TanStack Start
- Cloudflare R2