import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../../db/client'

interface CreateBody {
  title: string
  description: string
}

export const createSchema = {
  body: {
    type: 'object',
    required: ['title', 'description'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 255 },
      description: { type: 'string', minLength: 1 },
    },
  },
}

export async function createHandler(
  request: FastifyRequest<{ Body: CreateBody }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can create campaigns')
  }

  const { title, description } = request.body
  const id = uuidv4()

  await query(
    `INSERT INTO campaigns (id, content_creator_id, title, description, payout_per_view)
     VALUES (?, ?, ?, ?, 0)`,
    [id, request.user.sub, title, description]
  )

  return reply.code(201).send({ id, title, description, status: 'active' })
}
