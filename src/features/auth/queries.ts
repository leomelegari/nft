import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { getSessionToken, isApiError } from '@/shared/api'
import { fetchSession } from '@/features/auth/api'
import { getGuestId } from '@/features/cart/guest-id'

/**
 * Current session.
 *
 * Only queried when a token is actually held, so an anonymous visitor does not
 * fire a guaranteed 401 on every page load. A session that the server rejects
 * resolves to `null` rather than an error, because "not signed in" is a normal
 * state for most of this application, not a failure.
 */
export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session(),
    queryFn: async ({ signal }) => {
      if (!getSessionToken()) return null
      try {
        return await fetchSession(signal)
      } catch (error) {
        if (isApiError(error) && error.isSessionProblem) return null
        throw error
      }
    },
    staleTime: 60_000,
  })
}

export function useCurrentUser() {
  const { data } = useSessionQuery()
  return data?.user ?? null
}

export function useIsAuthenticated(): boolean {
  return useCurrentUser() !== null
}

/**
 * The key every private cache entry is namespaced under: the user id when
 * signed in, the guest id otherwise. Switching accounts therefore switches
 * cache namespaces, so one user's data can never be read as another's.
 */
export function useOwnerKey(): string {
  const user = useCurrentUser()
  return user ? user.id : `guest:${getGuestId()}`
}
