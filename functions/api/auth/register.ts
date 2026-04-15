import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { cors } from 'hono/cors'
import bcrypt from 'bcryptjs'

type Bindings = {
  DB: D1Database
  SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.post('/', async (c) => {
  const { email, password, name } = await c.req.json().catch(() => ({}))
  
  if (!email || !password || !name) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const db = c.env.DB
  
  // Check if user exists
  const existing = await db.prepare(
    'SELECT id FROM users WHERE email = ?'
  ).bind(email).first()
  
  if (existing) {
    return c.json({ error: 'Email already registered' }, 400)
  }

  // Hash password
  const password_hash = await bcrypt.hash(password, 10)
  const id = crypto.randomUUID()
  
  await db.prepare(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
  ).bind(id, email, password_hash, name).run()

  // Generate JWT
  const token = await new Promise<string>((resolve) => {
    const payload = { sub: id, email, is_admin: false }
    // @ts-expect-error jwt type issue
    const jwtObj = jwt({ secret: c.env.SECRET })
    // @ts-expect-error sign method
    jwtObj.sign(payload).then(resolve)
  })

  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax`)
  
  return c.json({ id, email, name, is_admin: false })
})

export default app