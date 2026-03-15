import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { query, queryOne } from '../../db/client'

interface SubmitBody {
  campaign_id: string
  title: string
  video_url: string
}

export const submitSchema = {
  body: {
    type: 'object',
    required: ['campaign_id', 'title', 'video_url'],
    properties: {
      campaign_id: { type: 'string', minLength: 1 },
      title: { type: 'string', minLength: 2, maxLength: 255 },
      video_url: { type: 'string', minLength: 1 },
    },
  },
}

export async function submitHandler(
  request: FastifyRequest<{ Body: SubmitBody }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'clipper') {
    return reply.forbidden('Only clippers can submit clips')
  }

  const { campaign_id, title, video_url } = request.body

  // Verify campaign exists and is active
  const campaign = await queryOne<{ id: string; status: string }>(
    'SELECT id, status FROM campaigns WHERE id = ?',
    [campaign_id]
  )

  if (!campaign) {
    return reply.notFound('Campaign not found')
  }

  if (campaign.status !== 'active') {
    return reply.badRequest('Campaign is not accepting submissions')
  }

  const id = uuidv4()

  await query(
    `INSERT INTO clips (id, campaign_id, clipper_id, title, video_url)
     VALUES (?, ?, ?, ?, ?)`,
    [id, campaign_id, request.user.sub, title, video_url]
  )

  return reply.code(201).send({
    id,
    campaign_id,
    clipper_id: request.user.sub,
    title,
    video_url,
    status: 'pending',
  })
}
