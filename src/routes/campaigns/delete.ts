import { FastifyRequest, FastifyReply } from 'fastify'
import { queryOne, query } from '../../db/client'

export async function deleteHandler(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can delete campaigns')
  }

  const { id } = request.params
  const campaign = await queryOne('SELECT id FROM campaigns WHERE id = ? AND content_creator_id = ?', [
    id,
    request.user.sub,
  ])
  if (!campaign) return reply.notFound('Campaign not found')

  await query('DELETE FROM campaigns WHERE id = ?', [id])
  return reply.code(204).send()
}
