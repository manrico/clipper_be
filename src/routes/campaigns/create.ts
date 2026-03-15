import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { query } from '../../db/client'

interface CreateBody {
  title: string
  description: string
  guidelines?: string
  payout_per_view?: number
  payout_fixed?: number
  clip_length_max?: number
  budget?: number
  platforms?: string[]
  language?: string
  deadline?: string
}

export const createSchema = {
  body: {
    type: 'object',
    required: ['title', 'description'],
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 255 },
      description: { type: 'string', minLength: 1 },
      guidelines: { type: 'string' },
      payout_per_view: { type: 'number', minimum: 0 },
      payout_fixed: { type: 'number', minimum: 0 },
      clip_length_max: { type: 'integer', minimum: 1 },
      budget: { type: 'number', minimum: 0 },
      platforms: { type: 'array', items: { type: 'string' } },
      language: { type: 'string', maxLength: 50 },
      deadline: { type: 'string', format: 'date' },
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

  const {
    title, description, guidelines, payout_per_view, payout_fixed,
    clip_length_max, budget, platforms, language, deadline,
  } = request.body
  const id = uuidv4()

  await query(
    `INSERT INTO campaigns
       (id, content_creator_id, title, description, guidelines,
        payout_per_view, payout_fixed, clip_length_max,
        budget, platforms, language, deadline)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id, request.user.sub, title, description,
      guidelines ?? null,
      payout_per_view ?? 0,
      payout_fixed ?? null,
      clip_length_max ?? null,
      budget ?? null,
      platforms ? JSON.stringify(platforms) : null,
      language ?? null,
      deadline ?? null,
    ]
  )

  return reply.code(201).send({ id, title, description, status: 'draft' })
}
