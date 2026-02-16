import { FastifyRequest, FastifyReply } from 'fastify'
import { query, queryOne } from '../../db/client'
import type { User } from '../../types'

interface VerifyEmailBody {
  token: string
}

export const verifyEmailSchema = {
  body: {
    type: 'object',
    required: ['token'],
    properties: {
      token: { type: 'string' },
    },
  },
}

export async function verifyEmailHandler(
  request: FastifyRequest<{ Body: VerifyEmailBody }>,
  reply: FastifyReply
) {
  const { token } = request.body

  const user = await queryOne<User & { email_verification_expires: Date }>(
    `SELECT id, email_verification_expires FROM users
     WHERE email_verification_token = ? AND email_verified = FALSE`,
    [token]
  )

  if (!user) {
    return reply.badRequest('Invalid or expired verification token')
  }

  const now = new Date()
  if (user.email_verification_expires && user.email_verification_expires < now) {
    return reply.badRequest('Verification token has expired. Please request a new one.')
  }

  await query(
    `UPDATE users
     SET email_verified = TRUE, email_verification_token = NULL, email_verification_expires = NULL
     WHERE id = ?`,
    [user.id]
  )

  return reply.send({ message: 'Email verified successfully. You can now log in.' })
}
