import { redirect } from '@tanstack/react-router'
import { CancelledError, type QueryClient } from '@tanstack/react-query'
import type { Session } from '@/entities/auth'
import { queryKeys } from '@/shared/api/query-keys'
import { getSessionToken, isApiError } from '@/shared/api'
import { sessionQueryOptions } from '@/features/auth/session-query'

/**
 * Guards a private route.
 *
 * Called from `beforeLoad`, so an unauthenticated visitor is redirected before
 * the route's loader runs and before any private request is made. The
 * destination is preserved in `redirect` so the user lands back where they
 * were heading — this is what makes an expired session mid-checkout resumable.
 */
export async function requireAuth(queryClient: QueryClient, href: string): Promise<void> {
  const unauthenticated = (): never => {
    throw redirect({ to: '/entrar', search: { redirect: href }, replace: true })
  }

  if (!getSessionToken()) unauthenticated()

  /**
   * A concurrent observer can cancel this fetch — the realtime subscription
   * reads the same key as it mounts. A cancellation is not an auth failure, so
   * it is retried once before falling back to whatever the cache holds;
   * bouncing a signed-in user to the login screen because of a race would be
   * the worst possible outcome here.
   *
   * `CancelledError` is identified by class: its `name` is just "Error".
   */
  const resolveSession = async (attempt = 0): Promise<Session | null> => {
    try {
      return await queryClient.ensureQueryData(sessionQueryOptions())
    } catch (error) {
      if (error instanceof CancelledError) {
        if (attempt === 0) return resolveSession(attempt + 1)
        return queryClient.getQueryData<Session | null>(queryKeys.session()) ?? null
      }
      if (isApiError(error) && error.isSessionProblem) return null
      throw error
    }
  }

  const session = await resolveSession()
  if (!session) unauthenticated()
}
