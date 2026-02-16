import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '../../db/client'

import { sendVerificationEmail } from '../../services/email'
import type { UserRole } from '../../types'

interface RegisterBody {
  name: string
  email: string
  password: string
  role: UserRole
}

export const registerSchema = {
  body: {
    type: 'object',
    required: ['name', 'email', 'password', 'role'],
    properties: {
      name: { type: 'string', minLength: 2, maxLength: 100 },
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      role: { type: 'string', enum: ['clipper', 'content_creator'] },
    },
  },
}

export async function registerHandler(
  request: FastifyRequest<{ Body: RegisterBody }>,
  reply: FastifyReply
) {
  const { name, email, password, role } = request.body

  // Check if email already exists
  const existing = await queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase()])
  if (existing) {
    return reply.conflict('Email address is already registered')
  }

  const emailVerificationEnabled = process.env.EMAIL_VERIFICATION_ENABLED !== 'false'

  const id = uuidv4()
  const passwordHash = await bcrypt.hash(password, 12)
  const verificationToken = uuidv4()
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24h

  await query(
    `INSERT INTO users (id, name, email, password_hash, role, email_verified, email_verification_token, email_verification_expires)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, name, email.toLowerCase(), passwordHash, role, emailVerificationEnabled ? 0 : 1, verificationToken, verificationExpires]
  )

  if (emailVerificationEnabled) {
    // Send verification email (non-blocking)
    sendVerificationEmail(email, name, verificationToken).catch((err) => {
      request.log.warn({ err }, 'Failed to send verification email')
    })
  }

  return reply.code(201).send({
    message: emailVerificationEnabled
      ? 'Registration successful. Please check your email to verify your account.'
      : 'Registration successful. You can now log in.',
    user: { id, name, email: email.toLowerCase(), role },
  })
}
