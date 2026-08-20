import { createDb, getDb } from '@repo/db'

/**
 * Resolves the database client dynamically.
 * Priority:
 * 1. env.DATABASE_URL (Worker bindings)
 * 2. process.env.DATABASE_URL (Node process env, for tests/scripts)
 */
export async function getDbClient(env?: { DATABASE_URL?: string }) {
  const dbUrl =
    env?.DATABASE_URL || (typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined)
  if (dbUrl) {
    return createDb(dbUrl)
  }
  return getDb()
}

export interface AppEnv {
  DATABASE_URL: string
}
