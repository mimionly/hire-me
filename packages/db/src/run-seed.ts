import 'dotenv/config'
import { getDb } from './db-client'
import { seedDatabase } from './seed'

async function run() {
  const db = await getDb()
  await seedDatabase(db)
}

run().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
