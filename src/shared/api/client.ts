import axios, { type AxiosRequestConfig } from 'axios'
import type { z } from 'zod'
import { normalizeError } from '@/shared/api/error'
import { getSessionToken } from '@/shared/api/session-token'

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
  (error: unknown) => Promise.reject(normalizeError(error)),
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
  const parsed = schema.safeParse(response.data)

  if (!parsed.success) {
    throw new Error(
      `Resposta fora do contrato em ${config.method?.toUpperCase() ?? 'GET'} ${config.url}: ${parsed.error.message}`,
    )
  }

  return parsed.data
}
