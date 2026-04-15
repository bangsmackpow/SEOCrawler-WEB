# SEOCrawler-WEB Agent Instructions

## Project Context

Cloudflare Pages application with Hono API + Drizzle ORM + TanStack Start.

## Key Files

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Drizzle ORM schema |
| `src/api/routes/*.ts` | API endpoints |
| `src/services/crawler.ts` | SEO crawler |
| `src/client/App.tsx` | Frontend app |
| `wrangler.jsonc` | Cloudflare config |
| `drizzle.config.ts` | Drizzle config |

## Deployment Commands

```bash
cd seocrawler-web

# Install deps
npm install

# Generate Drizzle migrations
npx drizzle-kit generate

# Push to D1
npx drizzle-kit push

# Build
npm run build:frontend

# Deploy
npm run deploy
```

## Important Notes

1. **JWT_SECRET** - Must be set in Cloudflare Pages environment variables
2. **D1 Database** - Already created with ID: `35f3b153-fb3b-4d7d-8ad3-87e98044a969`
3. **R2 Bucket** - Already created: `seocrawler-reports`

## Common Issues

| Issue | Solution |
|-------|----------|
| Auth fails | Check JWT_SECRET in Cloudflare |
| D1 errors | Run `drizzle-kit push` |
| Build fails | Check package.json dependencies |

## Tech Stack

- Hono (API)
- Drizzle ORM
- TanStack Start
- bcrypt
- Cloudflare D1/R2