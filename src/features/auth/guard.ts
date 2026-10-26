import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { getSessionToken, isApiError } from '@/shared/api'
import { fetchSession } from '@/features/auth/api'

/**
 * Guards a private route.
 *
 * Called from `beforeLoad`, so an unauthenticated visitor is redirected before
 * the route's loader runs and before any private request is made. The
 * destination is preserved in `redirect` so the user lands back where they were
 * heading — this is what makes an expired session mid-checkout resumable.
 */
export async function requireAuth(queryClient: QueryClient, href: string): Promise<void> {
  const unauthenticated = () => {
    throw redirect({ to: '/entrar', search: { redirect: href }, replace: true })
  }

  if (!getSessionToken()) unauthenticated()

  try {
    const session = await queryClient.ensureQueryData({
      queryKey: queryKeys.session(),
      queryFn: ({ signal }) => fetchSession(signal),
      revalidateIfStale: true,
    })
    if (!session) unauthenticated()
  } catch (error) {
    if (isApiError(error) && error.isSessionProblem) unauthenticated()
    throw error
  }
}
