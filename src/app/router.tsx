import {
  createRouter,
  parseSearchWith,
  stringifySearchWith,
} from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'
import { NotFound } from '@/shared/ui/not-found'
import { RouteError } from '@/shared/ui/route-error'

export interface RouterContext {
  queryClient: QueryClient
}

/**
 * Search-param serialisation.
 *
 * The router stringifies the *validated* search object, so an array produced by
 * a schema transform would otherwise land in the URL as `?collection=["musica"]`.
 * Arrays are emitted as comma-separated lists instead: shorter, readable, and
 * hand-editable, which matters for a view whose entire state is shareable by
 * link. Everything else keeps the default JSON behaviour.
 */
const stringifySearch = stringifySearchWith((value) =>
  Array.isArray(value) ? value.join(',') : JSON.stringify(value),
)

const parseSearch = parseSearchWith(JSON.parse)

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    // Loaders read through the query cache, so the router's own staleness
    // tracking is disabled to keep a single source of truth.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    /**
     * Show the route's skeleton quickly, then hold it long enough to be read.
     * The default 1s delay means a slow connection spends that whole second
     * showing nothing at all, and without a minimum the skeleton can flash.
     */
    defaultPendingMs: 200,
    defaultPendingMinMs: 400,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
    scrollRestoration: true,
    stringifySearch,
    parseSearch,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
