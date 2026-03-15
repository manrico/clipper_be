import { FastifyInstance } from 'fastify'
import { submitHandler, submitSchema } from './submit'
import { listMyHandler, listMySchema } from './list-my'
import { listByCampaignHandler, listByCampaignSchema } from './list-by-campaign'
import { reviewHandler, reviewSchema } from './review'
import { listForCreatorHandler, listForCreatorSchema } from './list-for-creator'

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

  // Creator: list all clips across own campaigns
  app.get('/for-creator', { schema: listForCreatorSchema, onRequest: [app.authenticate] }, listForCreatorHandler)

  // Creator: approve or reject a clip
  app.patch<{ Params: { id: string }; Body: { status: 'approved' | 'rejected'; rejection_reason?: string } }>(
    '/:id/review', { schema: reviewSchema, onRequest: [app.authenticate] }, reviewHandler
  )
}
