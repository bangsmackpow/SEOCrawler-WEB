import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { drizzle } from 'drizzle-orm/d1'
import authRouter from './api/routes/auth'
import reportsRouter from './api/routes/reports'
import crawlRouter from './api/routes/crawl'
import type { Bindings } from './env'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({ status: 'ok' })
})

app.route('/api/auth', authRouter)
app.route('/api/reports', reportsRouter)
app.route('/api/crawl', crawlRouter)

// Serve static frontend from /public
app.get('*', async (c) => {
  const url = new URL(c.req.url)
  
  // API routes go to backend
  if (url.pathname.startsWith('/api/')) {
    return c.text('Not Found', 404)
  }

  // Serve static files from pages build
  const htmlPath = url.pathname === '/' ? '/index.html' : url.pathname
  const cache = await c.env.ASSETS?.get(htmlPath)
  
  if (cache) {
    return new Response(cache.body, {
      headers: { 'Content-Type': getContentType(htmlPath) },
    })
  }

  // Fallback to index.html for SPA
  const index = await c.env.ASSETS?.get('/index.html')
  if (index) {
    return new Response(index.body, {
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return c.text('Not Found', 404)
})

function getContentType(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase()
  const types: Record<string, string> = {
    html: 'text/html',
    js: 'application/javascript',
    css: 'text/css',
    json: 'application/json',
    png: 'image/png',
    jpg: 'image/jpeg',
    svg: 'image/svg+xml',
  }
  return types[ext || ''] || 'text/plain'
}

export default app