import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getPool } from './client'

async function migrate() {
  const pool = getPool()
  const migrationsDir = join(__dirname, 'migrations')

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    console.log(`Running ${file} (${statements.length} statements)...`)
    try {
      for (const statement of statements) {
        await pool.execute(statement)
      }
      console.log(`  ✓ ${file} done`)
    } catch (err) {
      console.error(`  ✗ ${file} failed:`, err)
      process.exit(1)
    }
  }

  console.log('All migrations completed.')
  await pool.end()
}

migrate()
