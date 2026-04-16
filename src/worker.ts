import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bcrypt from 'bcryptjs'

type Bindings = {
  DB: D1Database
  REPORTS: R2Bucket
  SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/', (c) => {
  return c.text('SEOCrawler API - Visit /api/* endpoints', 200, {
    'Content-Type': 'text/plain'
  })
})

app.get('/health', (c) => c.json({ ok: true }))

app.get('/check', (c) => c.text('ok'))

app.get('/check-cookie', (c) => {
  const h = c.req.header('cookie') || ''
  return c.text('h: ' + h)
})

function getUser(c: any): { sub: string; email: string; is_admin: boolean } | null {
  const cookieHeader = c.req.header('cookie') || ''
  const match = cookieHeader.match(/token=([^;]+)/)
  if (!match) return null
try {
    const decoded = atob(match[1])
    const parsed = JSON.parse(decoded)
    return { sub: parsed.sub, email: parsed.email, is_admin: parsed.is_admin }
  } catch {
    return null
  }
}
}

app.post('/api/auth/register', async (c) => {
  const { email, password, name } = await c.req.json().catch(() => ({}))
  if (!email || !password || !name) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const db = c.env.DB
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) {
    return c.json({ error: 'Email already registered' }, 400)
  }

  const userCount = await db.prepare('SELECT COUNT(*) as count FROM users').first<{ count: number }>()
  const isFirstUser = !userCount || userCount.count === 0
  const isAdmin = isFirstUser ? 1 : 0

  const hash = await bcrypt.hash(password, 10)
  const id = crypto.randomUUID()
  await db.prepare('INSERT INTO users (id, email, password_hash, name, is_admin) VALUES (?, ?, ?, ?, ?)')
    .bind(id, email, hash, name, isAdmin).run()

  const token = btoa(JSON.stringify({ sub: id, email, is_admin: isFirstUser }))
  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`)
  return c.json({ id, email, name, is_admin: isFirstUser })
})

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}))
  if (!email || !password) {
    return c.json({ error: 'Missing email or password' }, 400)
  }

  const db = c.env.DB
  const user = await db.prepare('SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?')
    .bind(email).first<{ id: string; email: string; password_hash: string; name: string; is_admin: number }>()

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const token = btoa(JSON.stringify({ sub: user.id, email: user.email, is_admin: user.is_admin === 1 }))
  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`)
  return c.json({ id: user.id, email: user.email, name: user.name, is_admin: user.is_admin === 1 })
})

app.post('/api/auth/logout', (c) => {
  c.header('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0')
  return c.json({ ok: true })
})

app.get('/api/auth/me', (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401)
  }
  return c.json({ id: user.sub, email: user.email })
})

app.get('/api/reports', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const reports = await db.prepare(
    'SELECT id, domain, status, overall_score, critical_issues, created_at, completed_at FROM reports WHERE user_id = ? ORDER BY create_at DESC'
  ).bind(user.sub).all()
  return c.json(reports)
})

app.post('/api/reports', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { domain } = await c.req.json().catch(() => ({}))
  if (!domain) {
    return c.json({ error: 'Missing domain' }, 400)
  }

  const db = c.env.DB
  const id = crypto.randomUUID()
  const client_name = domain.split('.')[0]

  await db.prepare(
    'INSERT INTO reports (id, user_id, domain, client_name, status, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))'
  ).bind(id, user.sub, domain, client_name, 'pending').run()

  return c.json({ id, domain, status: 'pending' })
})

app.get('/api/reports/:id', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const db = c.env.DB
  const report = await db.prepare(`
    SELECT r.*, 
      (SELECT GROUP_CONCAT(object_key) FROM reports_objects WHERE report_id = r.id) as files
    FROM reports r 
    WHERE r.id = ? AND (r.user_id = ? OR EXISTS (SELECT 1 FROM shared_reports sr WHERE sr.report_id = r.id AND sr.shared_with_email = ?))
  `).bind(id, user.sub, user.email).first()

  if (!report) {
    return c.json({ error: 'Not found' }, 404)
  }

  const files = report.files ? report.files.split(',') : []
  return c.json({ ...report, files })
})

app.post('/api/reports/:id/share', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const { email } = await c.req.json().catch(() => ({}))

  if (!email) {
    return c.json({ error: 'Missing email' }, 400)
  }

  const db = c.env.DB
  await db.prepare('INSERT INTO shared_reports (id, report_id, shared_with_email) VALUES (?, ?, ?)')
    .bind(crypto.randomUUID(), id, email).run()

  return c.json({ ok: true })
})

app.get('/api/admin/settings', async (c) => {
  const user = getUser(c)
  if (!user || !user.is_admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const rows = await db.prepare('SELECT key, value FROM settings').all<{ key: string; value: string }>()
  const settings: Record<string, string> = {}
  for (const row of rows) {
    settings[row.key] = row.value
  }
  return c.json(settings)
})

app.post('/api/admin/settings', async (c) => {
  const user = getUser(c)
  if (!user || !user.is_admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const data = await c.req.json()
  const db = c.env.DB

  for (const [key, value] of Object.entries(data)) {
    await db.prepare(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime("now"))'
    ).bind(key, value).run()
  }

  return c.json({ ok: true })
})

app.get('/api/admin/users', async (c) => {
  const user = getUser(c)
  if (!user || !user.is_admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const db = c.env.DB
  const users = await db.prepare('SELECT id, email, name, is_admin, created_at FROM users').all()
  return c.json(users)
})

app.post('/api/admin/users', async (c) => {
  const user = getUser(c)
  if (!user || !user.is_admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { email, password, name } = await c.req.json()
  if (!email || !password || !name) {
    return c.json({ error: 'Missing fields' }, 400)
  }

  const db = c.env.DB
  const hash = await bcrypt.hash(password, 10)
  const id = crypto.randomUUID()

  await db.prepare('INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)')
    .bind(id, email, hash, name).run()

  return c.json({ id, email, name })
})

app.delete('/api/admin/users/:id', async (c) => {
  const user = getUser(c)
  if (!user || !user.is_admin) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const db = c.env.DB
  await db.prepare('DELETE FROM users WHERE id = ? AND is_admin = 0').bind(id).run()
  return c.json({ ok: true })
})

export default app