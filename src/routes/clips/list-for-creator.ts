import { FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../../db/client'

export const listForCreatorSchema = {}

export async function listForCreatorHandler(
  request: FastifyRequest,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can access this endpoint')
  }

  const clips = await query(
    `SELECT cl.id, cl.campaign_id, cl.clipper_id, cl.title, cl.video_url,
            cl.status, cl.rejection_reason, cl.views, cl.earnings,
            cl.created_at, cl.updated_at,
            c.title AS campaign_title,
            u.name AS clipper_name
     FROM clips cl
     JOIN campaigns c ON c.id = cl.campaign_id
     JOIN users u ON u.id = cl.clipper_id
     WHERE c.content_creator_id = ?
     ORDER BY cl.created_at DESC`,
    [request.user.sub]
  )

  return reply.send(clips)
}
