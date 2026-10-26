import { HttpResponse, delay } from 'msw'
import type { DefaultBodyType, HttpResponseResolver, PathParams } from 'msw'
import type { z } from 'zod'
import type { ApiErrorCode } from '@/entities/common'
import { getScenario, scenarioDelayMs, shouldFailTransiently } from '@/mocks/scenarios'
import { getDb, mutateDb } from '@/mocks/db/store'
import type { MockSession, MockUser } from '@/mocks/db/types'

/** HTTP status paired with each contract error code. */
const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHENTICATED: 401,
  SESSION_EXPIRED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  AVAILABILITY_CONFLICT: 409,
  COUPON_INVALID: 422,
  COUPON_EXPIRED: 422,
  QUOTE_STALE: 409,
  IDEMPOTENCY_CONFLICT: 409,
  PAYMENT_DECLINED: 402,
  TRANSIENT_ERROR: 503,
}

export function errorResponse(
  code: ApiErrorCode,
  message: string,
  extra?: { fields?: Record<string, string>; details?: unknown },
): Response {
  return HttpResponse.json(
    { error: { code, message, ...extra } },
    { status: STATUS_BY_CODE[code] },
  )
}

/**
 * Thrown by helpers so a handler can bail out mid-way; the wrapper converts it
 * back into a response. Keeps handlers linear instead of deeply nested.
 */
export class MockHttpError extends Error {
  readonly response: Response

  constructor(response: Response) {
    super('mock http error')
    this.response = response
  }
}

export function fail(
  code: ApiErrorCode,
  message: string,
  extra?: { fields?: Record<string, string>; details?: unknown },
): never {
  throw new MockHttpError(errorResponse(code, message, extra))
}

/**
 * Applies the active scenario's network conditions before a handler runs.
 * This is the only place latency and failure are injected, so every endpoint
 * behaves consistently under a given scenario.
 */
export async function applyNetworkConditions(): Promise<void> {
  const { network } = getScenario()

  if (network.timeout) {
    await delay('infinite')
  }

  // Latency is applied before any failure, including the offline case: a real
  // connection failure is detected after a wait, not instantly, and an
  // instant rejection would hide the optimistic window the UI relies on.
  await delay(scenarioDelayMs())

  if (network.offline) {
    throw new MockHttpError(HttpResponse.error())
  }

  if (shouldFailTransiently()) {
    fail('TRANSIENT_ERROR', 'Serviço temporariamente indisponível. Tente novamente.')
  }
}

/**
 * Wraps a resolver with network simulation and error translation.
 * Every handler in this project is registered through it.
 */
export function handler<Params extends PathParams = PathParams>(
  resolve: HttpResponseResolver<Params, DefaultBodyType, DefaultBodyType>,
): HttpResponseResolver<Params, DefaultBodyType, DefaultBodyType> {
  return async (info) => {
    try {
      await applyNetworkConditions()
      return await resolve(info)
    } catch (error) {
      if (error instanceof MockHttpError) return error.response
      throw error
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Session                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuthContext {
  user: MockUser
  session: MockSession
}

function readToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length)
}

/** Returns the session when present and valid, otherwise `null`. */
export function optionalAuth(request: Request): AuthContext | null {
  const token = readToken(request)
  if (!token) return null

  const db = getDb()
  const session = db.sessions.find((item) => item.token === token)
  if (!session) return null

  if (new Date(session.expiresAt) <= new Date()) {
    // Expired sessions are dropped server-side so a later call cannot revive one.
    mutateDb((draft) => {
      draft.sessions = draft.sessions.filter((item) => item.token !== token)
    })
    return null
  }

  const user = db.users.find((item) => item.id === session.userId)
  return user ? { user, session } : null
}

/** Enforces authentication, distinguishing "never signed in" from "expired". */
export function requireAuth(request: Request): AuthContext {
  const context = optionalAuth(request)
  if (context) return context

  const hadToken = readToken(request) !== null
  if (hadToken) {
    fail('SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente para continuar.')
  }
  fail('UNAUTHENTICATED', 'Entre na sua conta para acessar este recurso.')
}

/* -------------------------------------------------------------------------- */
/* Body parsing                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Parses and validates a request body against its contract, converting Zod
 * issues into the field-keyed shape the forms bind to.
 */
export async function parseBody<TSchema extends z.ZodType>(
  request: Request,
  schema: TSchema,
): Promise<z.infer<TSchema>> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    fail('VALIDATION_ERROR', 'Corpo da requisição inválido.')
  }

  const parsed = schema.safeParse(raw)
  if (parsed.success) return parsed.data

  const fields: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const key = issue.path.join('.') || '_'
    fields[key] ??= issue.message
  }

  fail('VALIDATION_ERROR', 'Verifique os campos destacados.', { fields })
}

/** Guest carts are keyed by a client-supplied id sent on every cart request. */
export function ownerKeyFor(request: Request): string {
  const context = optionalAuth(request)
  if (context) return context.user.id

  const guestId = request.headers.get('X-Guest-Id')
  if (!guestId) {
    fail('VALIDATION_ERROR', 'Identificador de visitante ausente.')
  }
  return `guest:${guestId}`
}
