import { cors } from 'hono/cors'

type Bindings = {
  DB: D1Database
  SECRET: string
}

type Middleware = {
  Bindings: Bindings
}

export function getAuthUser(c: { env: Bindings; req: { cookie: (k: string) => string | undefined } }) {
  const token = c.req.cookie('token')
  if (!token) return null

  try {
    const [header, body, sig] = token.split('.')
    const payload = JSON.parse(atob(body))
    // Simple validation - in production use proper JWT
    return payload
  } catch {
    return null
  }
}

export function handleAuth(c: Middleware) {
  return (handler: (c: { req: { cookie: (k: string) => string | undefined }, env: Bindings }) => Promise<Response>) => {
    return async (c: Middleware) => {
      const user = getAuthUser(c)
      if (!user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
      }
      return handler(c)
    }
  }
}