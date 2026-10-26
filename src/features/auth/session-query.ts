import type { Session } from '@/entities/auth'
import { getSessionToken, isApiError } from '@/shared/api'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchSession } from '@/features/auth/api'

/**
 * The single definition of the session query.
 *
 * The route guard and the `useSessionQuery` hook both read this key. Declaring
 * the fetcher once keeps them from registering two different `queryFn`s on the
 * same key, where whichever ran last would win and the two could disagree
 * about whether the user is signed in.
 *
 * Resolves to `null` rather than throwing when there is no token or the server
 * rejects the session: "not signed in" is a normal state across most of this
 * application, not a failure.
 */
export function sessionQueryOptions() {
  return {
    queryKey: queryKeys.session(),
    queryFn: async ({ signal }: { signal: AbortSignal }): Promise<Session | null> => {
      if (!getSessionToken()) return null
      try {
        return await fetchSession(signal)
      } catch (error) {
        if (isApiError(error) && error.isSessionProblem) return null
        throw error
      }
    },
    staleTime: 60_000,
  }
}
