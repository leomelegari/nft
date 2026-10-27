import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { normalizeError } from '@/shared/api/error'
import { clearSessionToken, getSessionToken } from '@/shared/api/session-token'
import { notifySessionInvalidated } from '@/features/auth/session-events'

/**
 * The single Axios instance every REST call goes through. It owns three
 * concerns and nothing else: base URL, credential attachment, and error
 * normalisation. It contains no business logic and no fallback data — the mock
 * layer is the only place responses come from (section 6).
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = getSessionToken()
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = normalizeError(error)

    /**
     * A session the server no longer accepts is dropped here, once, for every
     * caller. Expiry can surface on any request — including mid-checkout — so
     * handling it per call site would mean handling it in a dozen places and
     * missing one.
     */
    if (apiError.isSessionProblem) {
      clearSessionToken()
      notifySessionInvalidated()
    }

    return Promise.reject(apiError)
  },
)

/**
 * Performs a request and validates the response against its contract.
 *
 * Parsing here rather than in each hook means a server shape change surfaces at
 * the transport boundary with a precise Zod message, instead of as `undefined`
 * halfway down a component tree.
 */
export async function request<TSchema extends z.ZodType>(
  schema: TSchema,
  config: AxiosRequestConfig,
): Promise<z.infer<TSchema>> {
  const response = await api.request(config)
  const where = `${config.method?.toUpperCase() ?? 'GET'} ${config.url}`

  if (looksLikeAppShell(response.data)) {
    throw new Error(
      `A camada de mocks não respondeu a ${where}: o service worker não está ` +
        'ativo nesta aba, então a requisição chegou ao servidor estático e ' +
        'recebeu o index.html. Recarregue a página para registrá-lo de novo.',
    )
  }

  const parsed = schema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error(`Resposta fora do contrato em ${where}: ${parsed.error.message}`)
  }

  return parsed.data
}

/**
 * Detects a request that escaped the mock layer.
 *
 * Every REST route is served by the MSW service worker. When the worker is not
 * controlling the page — most often because the bundle was rebuilt while the
 * tab stayed open, which replaces the registration under it — the request
 * reaches the static server instead, and an SPA host answers *any* unmatched
 * path with `index.html` and a 200. The schema then reports "expected object,
 * received string", which is true but says nothing about the actual problem.
 */
function looksLikeAppShell(data: unknown): boolean {
  return typeof data === 'string' && /^\s*<(!doctype|html)/i.test(data)
}
