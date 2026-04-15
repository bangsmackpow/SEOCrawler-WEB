export type Bindings = {
  DB: D1Database
  SECRET: string
  OPENROUTER_API_KEY?: string
}

export type Env = {
 Bindings: Bindings
}