# SEOCrawler-WEB Agent Instructions

## Project Context

This is a Cloudflare Pages application for running SEO audits on websites.

## Key Files

| File | Purpose |
|------|---------|
| `wrangler.jsonc` | Cloudflare config - D1/R2 bindings here |
| `functions/api/[[path]].ts` | All API endpoints |
| `src/pages/Admin.tsx` | Settings, user management |
| `migrations/0000_initial.sql` | Database schema |
| `src/lib/render-seo-report.ts` | HTML report generator |

## Deployment Commands

```bash
cd seocrawler-web
npm install

# Create resources
wrangler d1 create seocrawler-db
wrangler r2 bucket create seocrawler-reports

# Apply schema
wrangler d1 execute seocrawler-db --file=./migrations/0000_initial.sql

# Build and deploy
npm run build
wrangler pages deploy
```

## Important Notes

1. **D1 Database** - Must be created first, then ID added to `wrangler.jsonc`
2. **R2 Bucket** - Must be created in same account
3. **JWT Secret** - Set via `wrangler secret put SECRET`
4. **Settings** - Stored in D1 `settings` table, managed via `/admin` page

## Running Tests

No tests configured yet. Add tests and run with:
```bash
npm test
```

## Linting

Run lint before commits:
```bash
npm run lint
```

## Common Issues

| Issue | Solution |
|-------|----------|
| API 404 | Check function path matches route |
| Auth fails | Verify SECRET in wrangler |
| R2 not found | Check bucket name in wrangler.jsonc |
| D1 errors | Run migration before deploy |

## Tech Stack

- Hono (API framework)
- React 18 (UI)
- shadcn/ui (components)
- Cloudflare D1 (SQLite database)
- Cloudflare R2 (file storage)
- Tailwind CSS