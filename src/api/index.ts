import { Hono } from 'hono'
import { cors } from 'hono/cors'
import authRouter from './routes/auth'
import reportsRouter from './routes/reports'
import crawlRouter from './routes/crawl'
import type { Bindings } from '../env'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/auth', authRouter)
app.route('/reports', reportsRouter)
app.route('/crawl', crawlRouter)

export default app
export type App = typeof app