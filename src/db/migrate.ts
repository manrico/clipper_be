import 'dotenv/config'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'
import { getPool } from './client'

async function migrate() {
  const pool = getPool()
  const migrationsDir = join(__dirname, 'migrations')

  // Ensure migrations tracking table exists
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name VARCHAR(255) PRIMARY KEY,
      applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Get already-applied migrations
  const [rows] = await pool.execute('SELECT name FROM _migrations')
  const applied = new Set((rows as { name: string }[]).map((r) => r.name))

  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`  ⏭ ${file} (already applied)`)
      continue
    }

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
      await pool.execute('INSERT INTO _migrations (name) VALUES (?)', [file])
      console.log(`  ✓ ${file} done`)
    } catch (err: any) {
      // Handle duplicate column/table errors gracefully during bootstrap
      // (migrations already applied before tracking was added)
      if (err.errno === 1060 || err.errno === 1061 || err.errno === 1050) {
        console.log(`  ⏭ ${file} (already applied — marking as done)`)
        await pool.execute('INSERT INTO _migrations (name) VALUES (?)', [file])
        continue
      }
      console.error(`  ✗ ${file} failed:`, err)
      process.exit(1)
    }
  }

  console.log('All migrations completed.')
  await pool.end()
}

migrate()
