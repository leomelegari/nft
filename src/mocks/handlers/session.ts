import { http, HttpResponse } from 'msw'
import { loginInputSchema, registerInputSchema, type User } from '@/entities/auth'
import { getDb, mutateDb, nextId } from '@/mocks/db/store'
import { digestPassword } from '@/mocks/db/seed'
import { getScenario } from '@/mocks/scenarios'
import type { MockUser } from '@/mocks/db/types'
import {
  fail,
  handler,
  optionalAuth,
  parseBody,
  requireAuth,
} from '@/mocks/handlers/support'

const DEFAULT_SESSION_TTL_MS = 60 * 60 * 1000

export function toPublicUser(user: MockUser): User {
  // Strips `passwordDigest` and `wallets` — wallets are their own resource and
  // the digest must never leave the simulated server.
  const { passwordDigest: _digest, wallets: _wallets, ...rest } = user
  return rest
}

function issueSession(userId: string) {
  const ttl = getScenario().behavior.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS
  const token = nextId('tok')
  const socketSessionId = nextId('sock')

  return mutateDb((draft) => {
    const session = {
      token,
      userId,
      expiresAt: new Date(Date.now() + ttl).toISOString(),
      socketSessionId,
    }
    // One active session per user keeps "troca de usuário" unambiguous.
    draft.sessions = draft.sessions.filter((item) => item.userId !== userId)
    draft.sessions.push(session)
    return session
  })
}

export const sessionHandlers = [
  http.post(
    '/api/auth/register',
    handler(async ({ request }) => {
      const input = await parseBody(request, registerInputSchema)
      const email = input.email.trim().toLowerCase()

      if (getDb().users.some((user) => user.email.toLowerCase() === email)) {
        fail('CONFLICT', 'Já existe uma conta com este e-mail.', {
          fields: { email: 'Este e-mail já está cadastrado' },
        })
      }

      const user = mutateDb((draft) => {
        const created: MockUser = {
          id: nextId('usr'),
          name: input.name.trim(),
          email,
          avatar: null,
          bio: '',
          location: '',
          memberSince: new Date().toISOString(),
          passwordDigest: digestPassword(input.password),
          wallets: [],
        }
        draft.users.push(created)
        return created
      })

      const session = issueSession(user.id)
      return HttpResponse.json(
        {
          token: session.token,
          session: { user: toPublicUser(user), expiresAt: session.expiresAt },
        },
        { status: 201 },
      )
    }),
  ),

  http.post(
    '/api/auth/login',
    handler(async ({ request }) => {
      const input = await parseBody(request, loginInputSchema)
      const email = input.email.trim().toLowerCase()
      const user = getDb().users.find((item) => item.email.toLowerCase() === email)

      // One generic message for both branches: confirming that an email exists
      // would leak the user base.
      if (!user || user.passwordDigest !== digestPassword(input.password)) {
        fail('VALIDATION_ERROR', 'E-mail ou senha incorretos.', {
          fields: { password: 'E-mail ou senha incorretos' },
        })
      }

      const session = issueSession(user.id)
      return HttpResponse.json({
        token: session.token,
        session: { user: toPublicUser(user), expiresAt: session.expiresAt },
      })
    }),
  ),

  http.get(
    '/api/auth/session',
    handler(({ request }) => {
      const context = requireAuth(request)
      return HttpResponse.json({
        user: toPublicUser(context.user),
        expiresAt: context.session.expiresAt,
      })
    }),
  ),

  http.post(
    '/api/auth/logout',
    handler(({ request }) => {
      const context = optionalAuth(request)
      if (context) {
        mutateDb((draft) => {
          draft.sessions = draft.sessions.filter(
            (item) => item.token !== context.session.token,
          )
        })
      }
      // Logging out an already-dead session is a success, not an error.
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
