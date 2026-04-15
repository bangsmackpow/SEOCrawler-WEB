import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq, desc, or } from 'drizzle-orm'
import * as schema from '../../db/schema'
import type { Bindings } from '../../env'

const reports = new Hono<{ Bindings: Bindings }>()

function getUser(c: { req: { cookie: (k: string) => string | undefined } }) {
  const token = c.req.cookie('token')
  if (!token) return null
  try {
    const [, body] = token.split('.')
    return JSON.parse(atob(body))
  } catch {
    return null
  }
}

// List reports for user
reports.get('/', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const db = drizzle(c.env.DB, { schema })
  const userReports = await db.query.reports.findMany({
    where: eq(schema.reports.userId, user.sub),
    orderBy: [desc(schema.reports.createdAt)],
  })

  return c.json(userReports)
})

// Get single report
reports.get('/:id', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  const report = await db.query.reports.findFirst({
    where: or(
      eq(schema.reports.id, id),
      eq(schema.reports.userId, user.sub)
    ),
  })

  if (!report) {
    return c.json({ error: 'Not found' }, 404)
  }

  // Get related data
  const pages = await db.query.crawledPages.findMany({
    where: eq(schema.crawledPages.reportId, id),
  })

  const issues = await db.query.issues.findMany({
    where: eq(schema.issues.reportId, id),
  })

  const keywords = await db.query.keywords.findMany({
    where: eq(schema.keywords.reportId, id),
  })

  return c.json({ ...report, pages, issues, keywords })
})

// Create new report
reports.post('/', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const { domain } = await c.req.json().catch(() => ({})) as { domain?: string }
  if (!domain) {
    return c.json({ error: 'Missing domain' }, 400)
  }

  const db = drizzle(c.env.DB, { schema })
  const id = crypto.randomUUID()
  const clientName = domain.split('.')[0]

  await db.insert(schema.reports).values({
    id,
    userId: user.sub,
    domain,
    clientName,
    status: 'pending',
  })

  return c.json({ id, domain, status: 'pending' })
})

// Share report
reports.post('/:id/share', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const { email } = await c.req.json().catch(() => ({})) as { email?: string }

  if (!email) {
    return c.json({ error: 'Missing email' }, 400)
  }

  const db = drizzle(c.env.DB, { schema })
  await db.insert(schema.sharedReports).values({
    id: crypto.randomUUID(),
    reportId: id,
    sharedWithEmail: email,
  })

  return c.json({ ok: true })
})

export default reports