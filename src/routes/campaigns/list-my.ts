import { FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../../db/client'

export const listMySchema = {}

export async function listMyHandler(request: FastifyRequest, reply: FastifyReply) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can access this endpoint')
  }

  const campaigns = await query(
    `SELECT
       c.id, c.title, c.description, c.status, c.payout_per_view, c.payout_fixed,
       c.created_at, c.updated_at,
       COUNT(DISTINCT cs.id) AS source_count,
       COUNT(DISTINCT cl.id) AS clip_count,
       (SELECT cs2.youtube_video_id FROM campaign_sources cs2
        WHERE cs2.campaign_id = c.id ORDER BY cs2.position ASC, cs2.created_at ASC LIMIT 1
       ) AS thumbnail_video_id
     FROM campaigns c
     LEFT JOIN campaign_sources cs ON cs.campaign_id = c.id
     LEFT JOIN clips cl ON cl.campaign_id = c.id
     WHERE c.content_creator_id = ?
     GROUP BY c.id
     ORDER BY c.created_at DESC`,
    [request.user.sub]
  )

  return reply.send(campaigns)
}
