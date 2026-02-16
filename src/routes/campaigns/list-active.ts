import { FastifyRequest, FastifyReply } from 'fastify'
import { query } from '../../db/client'

export const listActiveSchema = {}

export async function listActiveHandler(request: FastifyRequest, reply: FastifyReply) {
  const campaigns = await query(
    `SELECT
       c.id, c.title, c.description, c.status, c.payout_per_view, c.payout_fixed,
       c.created_at, u.name AS creator_name,
       COUNT(DISTINCT cs.id) AS source_count,
       COUNT(DISTINCT cl.id) AS clip_count,
       (SELECT cs2.youtube_video_id FROM campaign_sources cs2
        WHERE cs2.campaign_id = c.id ORDER BY cs2.position ASC, cs2.created_at ASC LIMIT 1
       ) AS thumbnail_video_id
     FROM campaigns c
     JOIN users u ON u.id = c.content_creator_id
     LEFT JOIN campaign_sources cs ON cs.campaign_id = c.id
     LEFT JOIN clips cl ON cl.campaign_id = c.id
     WHERE c.status = 'active'
     GROUP BY c.id
     ORDER BY c.created_at DESC`
  )

  return reply.send(campaigns)
}
