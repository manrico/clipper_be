import { FastifyRequest, FastifyReply } from 'fastify'
import { queryOne } from '../../db/client'
import type { User } from '../../types'

export async function meHandler(request: FastifyRequest, reply: FastifyReply) {
  const user = await queryOne<User>(
    'SELECT id, name, email, role, email_verified, created_at FROM users WHERE id = ?',
    [request.user.sub]
  )

  if (!user) {
    return reply.notFound('User not found')
  }

  return reply.send({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.email_verified,
    createdAt: user.created_at,
  })
}
