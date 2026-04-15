import { Hono } from 'hono'
import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  REPORTS: R2Bucket
  SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

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

app.get('/:id/download/:file', async (c) => {
  const user = getUser(c)
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const id = c.req.param('id')
  const file = c.req.param('file')

  const db = c.env.DB
  const report = await db.prepare(
    'SELECT user_id FROM reports WHERE id = ?'
  ).bind(id).first<{ user_id: string }>()

  if (!report || report.user_id !== user.sub) {
    return c.json({ error: 'Not found' }, 404)
  }

  const r2 = c.env.REPORTS
  const object = await r2.get(`${id}/${file}`)

  if (!object) {
    return c.json({ error: 'File not found' }, 404)
  }

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${file}"`,
    },
  })
})

export default app