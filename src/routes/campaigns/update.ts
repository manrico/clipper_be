import { FastifyRequest, FastifyReply } from 'fastify'
import { queryOne, query } from '../../db/client'

interface UpdateBody {
  title?: string
  description?: string
  guidelines?: string
  payout_per_view?: number
  payout_fixed?: number
  clip_length_max?: number
  budget?: number
  platforms?: string[]
  language?: string
  deadline?: string
  status?: 'draft' | 'active' | 'inactive' | 'completed'
}

export const updateSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    properties: {
      title: { type: 'string', minLength: 2, maxLength: 255 },
      description: { type: 'string' },
      guidelines: { type: 'string' },
      payout_per_view: { type: 'number', minimum: 0 },
      payout_fixed: { type: 'number', minimum: 0 },
      clip_length_max: { type: 'integer', minimum: 1 },
      budget: { type: 'number', minimum: 0 },
      platforms: { type: 'array', items: { type: 'string' } },
      language: { type: 'string', maxLength: 50 },
      deadline: { type: 'string', format: 'date' },
      status: { type: 'string', enum: ['draft', 'active', 'inactive', 'completed'] },
    },
  },
}

export async function updateHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateBody }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can update campaigns')
  }

  const { id } = request.params
  const campaign = await queryOne('SELECT id FROM campaigns WHERE id = ? AND content_creator_id = ?', [
    id,
    request.user.sub,
  ])
  if (!campaign) return reply.notFound('Campaign not found')

  const {
    title, description, guidelines, payout_per_view, payout_fixed,
    clip_length_max, budget, platforms, language, deadline, status,
  } = request.body

  const fields: string[] = []
  const values: unknown[] = []

  if (title !== undefined) { fields.push('title = ?'); values.push(title) }
  if (description !== undefined) { fields.push('description = ?'); values.push(description) }
  if (guidelines !== undefined) { fields.push('guidelines = ?'); values.push(guidelines) }
  if (payout_per_view !== undefined) { fields.push('payout_per_view = ?'); values.push(payout_per_view) }
  if (payout_fixed !== undefined) { fields.push('payout_fixed = ?'); values.push(payout_fixed) }
  if (clip_length_max !== undefined) { fields.push('clip_length_max = ?'); values.push(clip_length_max) }
  if (budget !== undefined) { fields.push('budget = ?'); values.push(budget) }
  if (platforms !== undefined) { fields.push('platforms = ?'); values.push(JSON.stringify(platforms)) }
  if (language !== undefined) { fields.push('language = ?'); values.push(language) }
  if (deadline !== undefined) { fields.push('deadline = ?'); values.push(deadline) }
  if (status !== undefined) { fields.push('status = ?'); values.push(status) }

  if (fields.length === 0) return reply.badRequest('No fields to update')

  values.push(id)
  await query(`UPDATE campaigns SET ${fields.join(', ')} WHERE id = ?`, values)

  const updated = await queryOne('SELECT * FROM campaigns WHERE id = ?', [id])
  return reply.send(updated)
}
