# SEOCrawler-WEB

Multi-user SEO audit platform deployed on Cloudflare Pages with D1 (SQLite) authentication and R2 storage.

## Tech Stack

| Component | Technology |
|-----------|------------|
| Framework | Hono (API) + React (UI) |
| UI Components | shadcn/ui |
| Database | Cloudflare D1 |
| Storage | Cloudflare R2 |
| Deployment | Cloudflare Pages |

## Features

- **Email/password authentication** - Multi-user accounts
- **Run SEO audits** - Background execution
- **View reports** - Download HTML/PDF exports
- **Share reports** - Share with other users via email
- **Admin panel** - Manage users, API keys, SMTP settings

## Project Structure

```
seocrawler-web/
├── src/                    # React UI
│   ├── pages/              # Page components
│   ├── components/         # UI components
│   └── lib/                # Utils, renderers
├── functions/              # Cloudflare Pages Functions (Hono API)
│   └── api/                # API endpoints
├── skills/                 # Kilo skills
├── migrations/             # D1 schema
├── wrangler.jsonc          # Cloudflare config
└── package.json
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Cloudflare

Update `wrangler.jsonc` with your:
- D1 database ID
- R2 bucket name
- `SECRET` for JWT signing

### 3. Create database

```bash
# Create D1 database
wrangler d1 create seocrawler-db

# Apply schema
wrangler d1 execute seocrawler-db --file=./migrations/0000_initial.sql
```

### 4. Create R2 bucket

```bash
wrangler r2 bucket create seocrawler-reports
```

### 5. Deploy

```bash
# Build frontend
npm run build

# Deploy to Cloudflare Pages
wrangler pages deploy
```

## Environment Variables

Set in `wrangler.jsonc` or via `wrangler secret put`:

| Variable | Description |
|----------|-------------|
| `SECRET` | JWT signing secret |
| `OPENROUTER_API_KEY` | For Kilo/AI agents (stored in D1 settings) |

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Current user |
| GET | `/api/reports` | List reports |
| POST | `/api/reports` | Start audit |
| GET | `/api/reports/:id` | Get report |
| POST | `/api/reports/:id/share` | Share report |
| GET | `/api/admin/settings` | Get settings (admin) |
| POST | `/api/admin/settings` | Save settings (admin) |
| GET | `/api/admin/users` | List users (admin) |
| POST | `/api/admin/users` | Add user (admin) |

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login |
| `/register` | Register |
| `/dashboard` | Reports dashboard |
| `/reports/:id` | Report details |
| `/admin` | Admin panel |

## Kilo Skills

The SEO workflow uses three Kilo skills:

1. **seo-specialist** - Technical SEO crawl
2. **content-marketer** - Content strategy
3. **sales-engineer** - Sales proposal

Configure API key in `/admin` page.

## HTML Renderers

`src/lib/render-seo-report.ts` - TypeScript port of Python renderers.
Generates styled HTML reports from markdown audit data.

## License

MIT