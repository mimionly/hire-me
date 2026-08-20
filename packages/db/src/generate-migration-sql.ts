import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const migrationsDir = path.resolve(__dirname, '../migrations')

if (fs.existsSync(migrationsDir)) {
  const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'))

  let content = '// This file is auto-generated. Do not edit directly.\n'
  for (const file of sqlFiles) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    // Remove Drizzle-specific statement breakpoints so standard SQL runner can execute it directly
    const cleanSql = sql.replace(/--> statement-breakpoint/g, ';')
    const varName = file.replace('.sql', '').replace(/[^a-zA-Z0-9]/g, '_')
    content += `export const SQL_${varName} = ${JSON.stringify(cleanSql)}\n`
  }

  fs.writeFileSync(path.resolve(__dirname, './migration-sql.ts'), content)
  console.log('✅ Generated migration-sql.ts')
} else {
  console.warn('⚠️ No migrations directory found.')
}
