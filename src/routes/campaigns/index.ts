import { FastifyInstance } from 'fastify'
import { createHandler, createSchema } from './create'
import { listMyHandler, listMySchema } from './list-my'
import { listActiveHandler, listActiveSchema } from './list-active'
import { getOneHandler, getOneSchema } from './get-one'
import { updateHandler, updateSchema } from './update'
import { deleteHandler } from './delete'
import { addSourceHandler, addSourceSchema } from './add-source'
import { removeSourceHandler } from './remove-source'

export default async function campaignRoutes(app: FastifyInstance) {
  // Creator: create campaign
  app.post<{ Body: { title: string; description: string } }>(
    '/', { schema: createSchema, onRequest: [app.authenticate] }, createHandler
  )

  // Creator: list own campaigns
  app.get('/my', { schema: listMySchema, onRequest: [app.authenticate] }, listMyHandler)

  // Any auth user: list all active campaigns (clippers browse)
  app.get('/', { schema: listActiveSchema, onRequest: [app.authenticate] }, listActiveHandler)

  // Any auth user: get single campaign with sources
  app.get<{ Params: { id: string } }>(
    '/:id', { schema: getOneSchema, onRequest: [app.authenticate] }, getOneHandler
  )

  // Creator: update campaign
  app.put<{ Params: { id: string }; Body: { title?: string; description?: string; guidelines?: string; payout_per_view?: number; payout_fixed?: number; status?: 'active' | 'inactive' | 'completed' } }>(
    '/:id', { schema: updateSchema, onRequest: [app.authenticate] }, updateHandler
  )

  // Creator: delete campaign
  app.delete<{ Params: { id: string } }>(
    '/:id', { onRequest: [app.authenticate] }, deleteHandler
  )

  // Creator: add video source
  app.post<{ Params: { id: string }; Body: { youtube_url: string } }>(
    '/:id/sources', { schema: addSourceSchema, onRequest: [app.authenticate] }, addSourceHandler
  )

  // Creator: remove video source
  app.delete<{ Params: { id: string; sourceId: string } }>(
    '/:id/sources/:sourceId', { onRequest: [app.authenticate] }, removeSourceHandler
  )
}
