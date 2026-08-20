import { neon } from '@neondatabase/serverless'
import { drizzle as neonDrizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema/index'

let cachedDb: any = null

/**
 * Returns a Drizzle database client.
 * Connects to Neon Serverless Postgres.
 */
export async function getDb() {
  if (cachedDb) {
    return cachedDb
  }

  const dbUrl = typeof process !== 'undefined' ? process.env.DATABASE_URL : undefined
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is missing')
  }

  console.log('🔌 Connecting to remote PostgreSQL (Neon)...')
  const sql = neon(dbUrl)
  cachedDb = neonDrizzle(sql, { schema })
  return cachedDb
}

export type DbClient = Awaited<ReturnType<typeof getDb>>
