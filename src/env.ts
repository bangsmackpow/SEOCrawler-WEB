export type Bindings = {
  DB: D1Database
  JWT_SECRET: string
  OPENROUTER_API_KEY?: string
}

export type Env = {
 Bindings: Bindings
}