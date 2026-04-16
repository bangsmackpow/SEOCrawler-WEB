# SEOCrawler-WEB

Multi-user SEO Audit Platform built on Cloudflare Workers + Pages.

## URLs

- **Frontend**: https://seocrawler-web.pages.dev
- **API**: https://seocrawler-web.curtislamasters.workers.dev

## Tech Stack

| Component | Technology |
|-----------|------------|
| API | Hono (Cloudflare Workers) |
| Database | Drizzle ORM + Cloudflare D1 |
| Frontend | React + Vite + Cloudflare Pages |
| Auth | bcryptjs |

## Quick Start

```bash
# Install dependencies
npm install

# Build frontend
npm run build:frontend

# Deploy
```

## Project Structure

```
seocrawler-web/
├── src/
│   ├── worker.ts       # Worker API (Hono)
│   ├── db/
│   │   └── schema.ts # Drizzle schema
│   └── lib/
│       └── auth.tsx # React auth context
├── wrangler.toml    # Worker config
├── drizzle.config.ts
└── dist/           # Built frontend
```

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/reports` | List reports |
| POST | `/api/reports` | Create report |
| GET | `/api/reports/:id` | Get report |
| POST | `/api/reports/:id/share` | Share report |
| GET | `/api/admin/users` | List users (admin) |
| POST | `/api/admin/settings` | Update settings (admin) |

## Deployment

### Frontend (Cloudflare Pages)
```bash
npx wrangler pages deploy dist --project-name=seocrawler-web
```

### API (Cloudflare Workers)
Auto-deploys via GitHub Actions on push to master.

### Manual Deploy
```bash
npx wrangler deploy src/worker.ts
```

## Cloudflare Resources

- D1 Database: `seocrawler-db` (35f3b153-fb3b-4d7d-8ad3-87e98044a969)
- R2 Bucket: `seocrawler-reports`

## License

MIT