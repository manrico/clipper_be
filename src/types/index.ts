export type UserRole = 'clipper' | 'content_creator'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  email_verified: boolean
  created_at: Date
  updated_at: Date
}

export interface JwtPayload {
  sub: string
  email: string
  role: UserRole
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: JwtPayload
    user: JwtPayload
  }
}
