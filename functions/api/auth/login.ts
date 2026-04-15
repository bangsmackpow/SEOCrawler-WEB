import { Hono } from 'hono'
import { cors } from 'hono/cors'
import bcrypt from 'bcryptjs'

type Bindings = {
  DB: D1Database
  SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors())

app.post('/', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({}))
  
  if (!email || !password) {
    return c.json({ error: 'Missing email or password' }, 400)
  }

  const db = c.env.DB
  
  // Find user
  const user = await db.prepare(
    'SELECT id, email, password_hash, name, is_admin FROM users WHERE email = ?'
  ).bind(email).first<{
    id: string
    email: string
    password_hash: string
    name: string
    is_admin: number
  }>()
  
  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Verify password
  const valid = await bcrypt.compare(password, user.password_hash)
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  // Generate JWT
  const payload = { 
    sub: user.id, 
    email: user.email, 
    is_admin: user.is_admin === 1 
  }
  
  // Create JWT manually (simple base64 encode)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const body = btoa(JSON.stringify(payload))
  const sig = btoa(c.env.SECRET + user.id) // Simple signature
  const token = `${header}.${body}.${sig}`

  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax`)
  
  return c.json({ 
    id: user.id, 
    email: user.email, 
    name: user.name, 
    is_admin: user.is_admin === 1 
  })
})

export default app