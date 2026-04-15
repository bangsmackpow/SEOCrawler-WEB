import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import * as schema from '../../db/schema'
import type { Bindings } from '../../env'

const auth = new Hono<{ Bindings: Bindings }>()

// Register
auth.post('/register', async (c) => {
  const { email, password, name } = await c.req.json().catch(() => ({}) as {
    email?: string
    password?: string
    name?: string
  })

  if (!email || !password || !name) {
    return c.json({ error: 'Missing required fields' }, 400)
  }

  const db = drizzle(c.env.DB, { schema })
  const existing = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (existing) {
    return c.json({ error: 'Email already registered' }, 400)
  }

  // Check if this is the first user - make them admin
  const allUsers = await db.query.users.findMany()
  const isFirstUser = allUsers.length === 0
  const isAdmin = isFirstUser

  const id = crypto.randomUUID()
  const passwordHash = await bcrypt.hash(password, 10)

  await db.insert(schema.users).values({
    id,
    email,
    passwordHash,
    name,
    isAdmin,
  })

  const token = btoa(JSON.stringify({ sub: id, email, isAdmin }))
  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax`)

  return c.json({ id, email, name, isAdmin })
})

// Login
auth.post('/login', async (c) => {
  const { email, password } = await c.req.json().catch(() => ({})) as {
    email?: string
    password?: string
  }

  if (!email || !password) {
    return c.json({ error: 'Missing email or password' }, 400)
  }

  const db = drizzle(c.env.DB, { schema })
  const user = await db.query.users.findFirst({
    where: eq(schema.users.email, email),
  })

  if (!user) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    return c.json({ error: 'Invalid email or password' }, 401)
  }

  const token = btoa(JSON.stringify({ sub: user.id, email: user.email, isAdmin: user.isAdmin }))
  c.header('Set-Cookie', `token=${token}; HttpOnly; Path=/; SameSite=Lax`)

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
  })
})

// Logout
auth.post('/logout', (c) => {
  c.header('Set-Cookie', 'token=; HttpOnly; Path=/; Max-Age=0')
  return c.json({ ok: true })
})

// Get current user
auth.get('/me', (c) => {
  const token = c.req.cookie('token')
  if (!token) {
    return c.json({ error: 'Not authenticated' }, 401)
  }

  try {
    const payload = JSON.parse(atob(token))
    return c.json({ id: payload.sub, email: payload.email, isAdmin: payload.isAdmin })
  } catch {
    return c.json({ error: 'Invalid token' }, 401)
  }
})

export default auth