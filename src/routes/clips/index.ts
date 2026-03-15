import { FastifyInstance } from 'fastify'
import { submitHandler, submitSchema } from './submit'
import { listMyHandler, listMySchema } from './list-my'
import { listByCampaignHandler, listByCampaignSchema } from './list-by-campaign'

export default async function clipRoutes(app: FastifyInstance) {
  // Clipper: submit a clip
  app.post<{ Body: { campaign_id: string; title: string; video_url: string } }>(
    '/', { schema: submitSchema, onRequest: [app.authenticate] }, submitHandler
  )

  // Clipper: list own clips
  app.get('/my', { schema: listMySchema, onRequest: [app.authenticate] }, listMyHandler)

  // Any auth: list clips for a campaign (scoped by role)
  app.get<{ Params: { campaignId: string } }>(
    '/campaign/:campaignId', { schema: listByCampaignSchema, onRequest: [app.authenticate] }, listByCampaignHandler
  )
}
