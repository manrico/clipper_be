import { FastifyRequest, FastifyReply } from 'fastify'
import { queryOne, query } from '../../db/client'

export const getOneSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
}

export async function getOneHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  const { id } = request.params

  const campaign = await queryOne<Record<string, unknown>>(
    `SELECT c.*, u.name AS creator_name
     FROM campaigns c
     JOIN users u ON u.id = c.content_creator_id
     WHERE c.id = ?`,
    [id]
  )

  if (!campaign) return reply.notFound('Campaign not found')

  // Creators can only see their own inactive/completed campaigns
  if (
    campaign.status !== 'active' &&
    campaign.content_creator_id !== request.user.sub
  ) {
    return reply.notFound('Campaign not found')
  }

  const sources = await query(
    `SELECT id, youtube_url, youtube_video_id, position, created_at
     FROM campaign_sources
     WHERE campaign_id = ?
     ORDER BY position ASC, created_at ASC`,
    [id]
  )

  return reply.send({ ...campaign, sources })
}
