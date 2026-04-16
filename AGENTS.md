# SEOCrawler-WEB Agent Instructions

## Project Context

Cloudflare Pages (frontend) + Cloudflare Workers (API) with Hono + Drizzle ORM + React.

## URLs

- **Frontend**: https://seocrawler-web.pages.dev
- **API**: https://seocrawler-web.curtislamasters.workers.dev

## Key Files

| File | Purpose |
|------|---------|
| `src/worker.ts` | Worker API |
| `src/db/schema.ts` | Drizzle ORM schema |
| `src/lib/auth.tsx` | Auth context |
| `wrangler.toml` | Worker config |
| `drizzle.config.ts` | Drizzle config |

## Deployments

### Frontend (Pages)
```bash
cd seocrawler-web
npm run build:frontend
npx wrangler pages deploy dist --project-name=seocrawler-web
```

### API (Worker)
```bash
cd seocrawler-web
git push origin master  # Auto-deploys via GitHub Actions
```

## Important Notes

1. **D1 Database** - ID: `35f3b153-fb3b-4d7d-8ad3-87e98044a969`
2. **R2 Bucket** - Already created: `seocrawler-reports`
3. **GitHub Actions** - Auto-deploys Worker on push to master

## Common Issues

| Issue | Solution |
|-------|----------|
| 405 errors | Check CORS settings in worker.ts |
| Cookie issues | Cookie passed via header, not req.cookie() |
| D1 errors | Run migration: `npx wrangler d1 execute seocrawler-db --file=migrations/0000.sql --remote` |

## Tech Stack

- Hono (API in Cloudflare Workers)
- Drizzle ORM + D1
- React + Vite
- bcryptjs
- Cloudflare R2