import { FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../../db/client'

export const listMySchema = {}

export async function listMyHandler(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'clipper') {
    return reply.forbidden('Only clippers can access this endpoint')
  }

  const clips = await query(
    `SELECT cl.id, cl.campaign_id, cl.clipper_id, cl.title, cl.video_url,
            cl.status, cl.rejection_reason, cl.views, cl.earnings,
            cl.created_at, cl.updated_at,
            c.title AS campaign_title
     FROM clips cl
     JOIN campaigns c ON c.id = cl.campaign_id
     WHERE cl.clipper_id = ?
     ORDER BY cl.created_at DESC`,
    [request.user.sub]
  )

  return reply.send(clips)
}
