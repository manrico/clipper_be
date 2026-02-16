import { FastifyInstance } from 'fastify'
import { registerHandler, registerSchema } from './register'
import { loginHandler, loginSchema } from './login'
import { meHandler } from './me'
import { verifyEmailHandler, verifyEmailSchema } from './verify-email'

export default async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/register', { schema: registerSchema }, registerHandler)
  fastify.post('/login', { schema: loginSchema }, loginHandler)
  fastify.get('/me', { onRequest: [fastify.authenticate] }, meHandler)
  fastify.post('/verify-email', { schema: verifyEmailSchema }, verifyEmailHandler)
}
