import { apiErrorSchema, type ApiErrorCode } from '@/entities/common'

/**
 * Every failure the UI sees is an `ApiError`. Axios errors, non-conforming
 * payloads and network failures are all normalised into this one shape by the
 * response interceptor, so no component ever inspects `error.response.data`.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number
  readonly fields: Readonly<Record<string, string>>
  readonly details: unknown

  constructor(init: {
    code: ApiErrorCode
    message: string
    status: number
    fields?: Record<string, string>
    details?: unknown
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.code = init.code
    this.status = init.status
    this.fields = Object.freeze({ ...init.fields })
    this.details = init.details
  }

  get isSessionProblem(): boolean {
    return this.code === 'UNAUTHENTICATED' || this.code === 'SESSION_EXPIRED'
  }

  /** Transient failures are the ones a retry can plausibly fix. */
  get isRetryable(): boolean {
    return this.code === 'TRANSIENT_ERROR' || this.status === 0 || this.status >= 500
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

const NETWORK_FAILURE_MESSAGE =
  'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.'

/** Builds an `ApiError` from whatever Axios produced. */
export function normalizeError(error: unknown): ApiError {
  const axiosLike = error as {
    response?: { status?: number; data?: unknown }
    code?: string
    message?: string
  }

  const response = axiosLike?.response

  if (!response) {
    const timedOut = axiosLike?.code === 'ECONNABORTED' || axiosLike?.code === 'ETIMEDOUT'
    return new ApiError({
      code: 'TRANSIENT_ERROR',
      status: 0,
      message: timedOut
        ? 'A requisição demorou mais que o esperado. Tente novamente.'
        : NETWORK_FAILURE_MESSAGE,
    })
  }

  const status = response.status ?? 0
  const parsed = apiErrorSchema.safeParse(response.data)

  if (parsed.success) {
    const { code, message, fields, details } = parsed.data.error
    return new ApiError({
      code,
      message,
      status,
      ...(fields ? { fields } : {}),
      details,
    })
  }

  // A response that does not match the error contract is still a failure —
  // surface it rather than letting an unparsed body reach the UI.
  return new ApiError({
    code: status >= 500 ? 'TRANSIENT_ERROR' : 'VALIDATION_ERROR',
    status,
    message: axiosLike?.message ?? 'Erro inesperado ao comunicar com o servidor.',
  })
}
