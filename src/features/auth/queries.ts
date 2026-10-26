import { useQuery } from '@tanstack/react-query'
import { getGuestId } from '@/features/cart/guest-id'
import { sessionQueryOptions } from '@/features/auth/session-query'

/**
 * Current session. See `sessionQueryOptions` for why the fetcher lives apart
 * from this hook.
 */
export function useSessionQuery() {
  return useQuery(sessionQueryOptions())
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
