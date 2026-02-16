import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { queryOne } from '../../db/client'
import type { User } from '../../types'

interface LoginBody {
  email: string
  password: string
}

interface UserWithPassword extends User {
  password_hash: string
}

export const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 1 },
    },
  },
}

export async function loginHandler(
  request: FastifyRequest<{ Body: LoginBody }>,
  reply: FastifyReply
) {
  const { email, password } = request.body

  const user = await queryOne<UserWithPassword>(
    'SELECT id, name, email, role, email_verified, password_hash FROM users WHERE email = ?',
    [email.toLowerCase()]
  )

  if (!user) {
    return reply.unauthorized('Invalid email or password')
  }

  const validPassword = await bcrypt.compare(password, user.password_hash)
  if (!validPassword) {
    return reply.unauthorized('Invalid email or password')
  }

  const emailVerificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED !== 'false'
  if (emailVerificationEnabled && !user.email_verified) {
    return reply.forbidden('Please verify your email address before logging in')
  }

  const token = request.server.jwt.sign({
    sub: user.id,
    email: user.email,
    role: user.role,
  })

  return reply.send({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.email_verified,
    },
  })
}
