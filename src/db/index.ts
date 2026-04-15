import { drizzle } from 'drizzle-orm/d1'
import type { DrizzleD1Database } from 'drizzle-orm/d1'
import * as schema from './schema'

export { schema }

export type Database = DrizzleD1Database

export function createDB(d1: D1Database): Database {
  return drizzle(d1, { schema })
}

export { schema as tables }