import { FastifyRequest, FastifyReply } from 'fastify'
import { query, queryOne } from '../../db/client'

export const listByCampaignSchema = {}

export async function listByCampaignHandler(
  request: FastifyRequest<{ Params: { campaignId: string } }>,
  reply: FastifyReply
) {
  const { campaignId } = request.params

  // Check campaign exists
  const campaign = await queryOne<{ id: string; content_creator_id: string }>(
    'SELECT id, content_creator_id FROM campaigns WHERE id = ?',
    [campaignId]
  )

  if (!campaign) {
    return reply.notFound('Campaign not found')
  }

  const isOwner = request.user.sub === campaign.content_creator_id
  const isClipper = request.user.role === 'clipper'

  // Clippers see only their own clips; creators who own the campaign see all
  let sql = `SELECT cl.id, cl.campaign_id, cl.clipper_id, cl.title, cl.video_url,
                    cl.status, cl.rejection_reason, cl.views, cl.earnings,
                    cl.created_at, cl.updated_at,
                    u.name AS clipper_name
             FROM clips cl
             JOIN users u ON u.id = cl.clipper_id
             WHERE cl.campaign_id = ?`
  const params: unknown[] = [campaignId]

  if (isClipper) {
    sql += ' AND cl.clipper_id = ?'
    params.push(request.user.sub)
  } else if (!isOwner) {
    // Non-owner creators shouldn't see clips for campaigns they don't own
    return reply.forbidden('You do not have access to this campaign\'s clips')
  }

  sql += ' ORDER BY cl.created_at DESC'

  const clips = await query(sql, params)

  return reply.send(clips)
}
