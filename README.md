# SEOCrawler-WEB

SEO Audit Platform - Built with BN-WAS (Built Networks Web App Standard)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Hono (Cloudflare Pages Functions) |
| Database | Drizzle ORM + Cloudflare D1 |
| Frontend | TanStack Start |
| Auth | bcrypt |

## Quick Start

```bash
# Install dependencies
npm install

# Generate Drizzle migration
npx drizzle-kit generate

# Push schema to D1
npx drizzle-kit push

# Deploy to Cloudflare
npm run deploy

# Or build frontend only
npm run build:frontend
```

## Environment Variables

Set in Cloudflare Pages:

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret for JWT signing |
| `OPENROUTER_API_KEY` | Optional - for Kilo prompts |

## Project Structure

```
src/
├── db/
│   ├── schema.ts     # Drizzle schema
│   └── index.ts     # DB connection
├── api/
│   ├── index.ts    # Main Hono app
│   └── routes/
│       ├── auth.ts    # Auth routes
│       ├── reports.ts # Reports CRUD
│       └── crawl.ts  # SEO crawl
├── services/
│   └── crawler.ts  # Internal SEO crawler
├── client/
│   ├── App.tsx     # TanStack Start app
│   └── index.tsx    # Entry config
├── env.ts           # Environment types
└── worker.ts       # Cloudflare Worker entry
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
| GET | `/api/reports/:id` | Get report details |
| POST | `/api/reports/:id/share` | Share report |
| POST | `/api/crawl/:id/start` | Start crawl |
| GET | `/api/crawl/:id/status` | Get crawl status |

## Development

```bash
# Local development
npm run dev

# Deploy
npm run deploy
```

## Cloudflare Setup

1. Create D1 database
2. Create R2 bucket for reports
3. Set `JWT_SECRET` in Pages environment variables
4. Connect GitHub repo in Cloudflare Pages

## License

MIT