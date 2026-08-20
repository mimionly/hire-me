import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { neon } from '@neondatabase/serverless'
import { createDb } from './index'
import { seedDatabase } from './seed'

const dbUrl = process.env.DATABASE_URL
if (!dbUrl) {
  console.error('❌ DATABASE_URL environment variable is missing!')
  process.exit(1)
}

async function run() {
  console.log('🔗 Connecting to Neon remote PostgreSQL...')
  const sql = neon(dbUrl!)

  console.log('📂 Reading migrations SQL...')
  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const sqlPath = path.resolve(__dirname, '../migrations/0000_goofy_the_renegades.sql')
  const sqlContent = fs.readFileSync(sqlPath, 'utf8')

  const statements = sqlContent.split('--> statement-breakpoint')
  console.log(`🚀 Executing ${statements.length} migration statements...`)

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i]?.trim()
    if (!statement) continue
    try {
      await sql(statement)
    } catch (err: any) {
      if (err.message.includes('already exists')) {
        console.log(`⚠️ Statement ${i} already applied (type/table exists)`)
      } else {
        console.error(`❌ Error in statement ${i}:`, err.message)
        throw err
      }
    }
  }

  console.log('✅ Remote migration applied successfully!')

  console.log('🌱 Seeding database...')
  const db = createDb(dbUrl!)
  await seedDatabase(db)
  console.log('✅ Seeding complete!')
}

run().catch((err) => {
  console.error('❌ Migration and seeding failed:', err)
  process.exit(1)
})
