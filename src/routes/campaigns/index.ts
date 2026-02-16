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
  app.post('/', { schema: createSchema, onRequest: [app.authenticate] }, createHandler)

  // Creator: list own campaigns
  app.get('/my', { schema: listMySchema, onRequest: [app.authenticate] }, listMyHandler)

  // Any auth user: list all active campaigns (clippers browse)
  app.get('/', { schema: listActiveSchema, onRequest: [app.authenticate] }, listActiveHandler)

  // Any auth user: get single campaign with sources
  app.get('/:id', { schema: getOneSchema, onRequest: [app.authenticate] }, getOneHandler)

  // Creator: update campaign
  app.put('/:id', { schema: updateSchema, onRequest: [app.authenticate] }, updateHandler)

  // Creator: delete campaign
  app.delete('/:id', { onRequest: [app.authenticate] }, deleteHandler)

  // Creator: add video source
  app.post('/:id/sources', { schema: addSourceSchema, onRequest: [app.authenticate] }, addSourceHandler)

  // Creator: remove video source
  app.delete('/:id/sources/:sourceId', { onRequest: [app.authenticate] }, removeSourceHandler)
}
