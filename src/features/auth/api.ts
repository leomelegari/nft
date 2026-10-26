import { z } from 'zod'
import { sessionSchema, userSchema, type Session } from '@/entities/auth'
import { request } from '@/shared/api'

export const authResultSchema = z.object({
  token: z.string(),
  session: sessionSchema,
})
export type AuthResult = z.infer<typeof authResultSchema>

/** `GET /auth/session` returns the session body without the token. */
const sessionResponseSchema = z.object({
  user: userSchema,
  expiresAt: z.iso.datetime(),
})

export function fetchSession(signal?: AbortSignal): Promise<Session> {
  return request(sessionResponseSchema, {
    method: 'GET',
    url: '/auth/session',
    ...(signal ? { signal } : {}),
  })
}
