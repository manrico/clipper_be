import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { getPool } from '../db/client'

async function dbPlugin(fastify: FastifyInstance) {
  const pool = getPool()

  // Verify connection on startup
  try {
    const conn = await pool.getConnection()
    conn.release()
    fastify.log.info('Database connected')
  } catch (err) {
    fastify.log.error('Database connection failed: ' + String(err))
    throw err
  }

  fastify.addHook('onClose', async () => {
    await pool.end()
    fastify.log.info('Database pool closed')
  })
}

export default fp(dbPlugin, { name: 'db' })
