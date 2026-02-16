import { FastifyRequest, FastifyReply } from 'fastify'
import { queryOne, query } from '../../db/client'

export async function removeSourceHandler(
  request: FastifyRequest<{ Params: { id: string; sourceId: string } }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can remove sources')
  }

  const { id, sourceId } = request.params

  // Verify campaign ownership
  const campaign = await queryOne('SELECT id FROM campaigns WHERE id = ? AND content_creator_id = ?', [
    id,
    request.user.sub,
  ])
  if (!campaign) return reply.notFound('Campaign not found')

  const source = await queryOne('SELECT id FROM campaign_sources WHERE id = ? AND campaign_id = ?', [
    sourceId,
    id,
  ])
  if (!source) return reply.notFound('Source not found')

  await query('DELETE FROM campaign_sources WHERE id = ?', [sourceId])
  return reply.code(204).send()
}
