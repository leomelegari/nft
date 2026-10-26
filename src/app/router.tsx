import { createRouter } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'
import { routeTree } from '@/routeTree.gen'
import { NotFound } from '@/shared/ui/not-found'
import { RouteError } from '@/shared/ui/route-error'

export interface RouterContext {
  queryClient: QueryClient
}

export function createAppRouter(queryClient: QueryClient) {
  return createRouter({
    routeTree,
    context: { queryClient },
    // Loaders read through the query cache, so the router's own staleness
    // tracking is disabled to keep a single source of truth.
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultNotFoundComponent: NotFound,
    defaultErrorComponent: RouteError,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
