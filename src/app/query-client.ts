import { QueryClient } from '@tanstack/react-query'

/**
 * Cache policy (documented in ARCHITECTURE.md).
 *
 * - `staleTime` 30s: catalog and detail data is allowed to be served from cache
 *   while a background refetch runs. Socket events push authoritative updates in
 *   between, so a short stale window does not show the user a wrong price.
 * - `gcTime` 5min: keeps paginated catalog pages warm for back/forward navigation.
 * - Retries are capped at 2 with exponential backoff and are disabled entirely for
 *   4xx responses, which are deterministic client errors and never recover on retry.
 * - Mutations never retry automatically. Order creation is idempotent and retried
 *   explicitly by the checkout flow using its idempotency key; a blind retry here
 *   would race with that.
 */
const FOUR_HUNDRED = 400
const FIVE_HUNDRED = 500
const MAX_QUERY_RETRIES = 2

function isClientError(error: unknown): boolean {
  const status = (error as { response?: { status?: number } } | undefined)?.response
    ?.status
  return typeof status === 'number' && status >= FOUR_HUNDRED && status < FIVE_HUNDRED
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 300_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) =>
          !isClientError(error) && failureCount < MAX_QUERY_RETRIES,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      },
      mutations: {
        retry: false,
      },
    },
  })
}
