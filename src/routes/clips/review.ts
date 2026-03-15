import { FastifyRequest, FastifyReply } from 'fastify'
import { query, queryOne } from '../../db/client'

interface ReviewBody {
  status: 'approved' | 'rejected'
  rejection_reason?: string
}

export const reviewSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    required: ['status'],
    properties: {
      status: { type: 'string', enum: ['approved', 'rejected'] },
      rejection_reason: { type: 'string', maxLength: 1000 },
    },
  },
}

export async function reviewHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: ReviewBody }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can review clips')
  }

  const { id } = request.params
  const { status, rejection_reason } = request.body

  // Fetch clip and verify ownership via campaign
  const clip = await queryOne<{ id: string; campaign_id: string; content_creator_id: string }>(
    `SELECT cl.id, cl.campaign_id, c.content_creator_id
     FROM clips cl
     JOIN campaigns c ON c.id = cl.campaign_id
     WHERE cl.id = ?`,
    [id]
  )

  if (!clip) return reply.notFound('Clip not found')

  if (clip.content_creator_id !== request.user.sub) {
    return reply.forbidden('You can only review clips for your own campaigns')
  }

  await query(
    'UPDATE clips SET status = ?, rejection_reason = ? WHERE id = ?',
    [status, status === 'rejected' ? (rejection_reason || null) : null, id]
  )

  const updated = await queryOne('SELECT * FROM clips WHERE id = ?', [id])
  return reply.send(updated)
}
