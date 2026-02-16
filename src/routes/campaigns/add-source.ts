import { FastifyRequest, FastifyReply } from 'fastify'
import { v4 as uuidv4 } from 'uuid'
import { queryOne, query } from '../../db/client'
import { extractYouTubeVideoId } from '../../utils/youtube'

interface AddSourceBody {
  youtube_url: string
}

export const addSourceSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: { id: { type: 'string' } },
  },
  body: {
    type: 'object',
    required: ['youtube_url'],
    properties: {
      youtube_url: { type: 'string' },
    },
  },
}

export async function addSourceHandler(
  request: FastifyRequest<{ Params: { id: string }; Body: AddSourceBody }>,
  reply: FastifyReply
) {
  if (request.user.role !== 'content_creator') {
    return reply.forbidden('Only content creators can add sources')
  }

  const { id } = request.params
  const campaign = await queryOne('SELECT id FROM campaigns WHERE id = ? AND content_creator_id = ?', [
    id,
    request.user.sub,
  ])
  if (!campaign) return reply.notFound('Campaign not found')

  const { youtube_url } = request.body
  const videoId = extractYouTubeVideoId(youtube_url)
  if (!videoId) {
    return reply.badRequest('Invalid YouTube URL — could not extract video ID')
  }

  // Get next position
  const last = await queryOne<{ max_pos: number }>(
    'SELECT MAX(position) AS max_pos FROM campaign_sources WHERE campaign_id = ?',
    [id]
  )
  const position = (last?.max_pos ?? -1) + 1

  const sourceId = uuidv4()
  await query(
    `INSERT INTO campaign_sources (id, campaign_id, youtube_url, youtube_video_id, position)
     VALUES (?, ?, ?, ?, ?)`,
    [sourceId, id, youtube_url, videoId, position]
  )

  return reply.code(201).send({
    id: sourceId,
    campaign_id: id,
    youtube_url,
    youtube_video_id: videoId,
    position,
  })
}
