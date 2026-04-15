import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import * as schema from '../../db/schema'
import { crawlDomain } from '../../services/crawler'
import type { Bindings } from '../../env'

const crawl = new Hono<{ Bindings: Bindings }>()

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

// Start crawl for a report
crawl.post('/:id/start', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
  })

  if (!report) {
    return c.json({ error: 'Report not found' }, 404)
  }

  if (report.userId !== user.sub && !user.isAdmin) {
    return c.json({ error: 'Forbidden' }, 403)
  }

  // Update status to running
  await db.update(schema.reports).set({
    status: 'running',
  }).where(eq(schema.reports.id, id))

  // Run crawl in background (this will complete before response for small sites)
  try {
    await crawlDomain(report.domain, db, id)
  } catch (e) {
    await db.update(schema.reports).set({
      status: 'failed',
    }).where(eq(schema.reports.id, id))
    return c.json({ error: 'Crawl failed' }, 500)
  }

  return c.json({ status: 'completed' })
})

// Get crawl status
crawl.get('/:id/status', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const db = drizzle(c.env.DB, { schema })

  const report = await db.query.reports.findFirst({
    where: eq(schema.reports.id, id),
  })

  if (!report) {
    return c.json({ error: 'Report not found' }, 404)
  }

  return c.json({
    status: report.status,
    overallScore: report.overallScore,
    criticalIssues: report.criticalIssues,
    crawledPageCount: report.crawledPageCount,
  })
})

export default crawl