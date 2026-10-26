import { Outlet, createRootRouteWithContext } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { AppShell } from '@/shared/layout/app-shell'
import { NotFound } from '@/shared/ui/not-found'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  // Rendered inside the root component's Outlet, so it is already wrapped by
  // AppShell and must not add a second one.
  notFoundComponent: NotFound,
})

function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      {/* Keyboard users land here first; required by section 8. */}
      <a
        href="#main-content"
        className="sr-only rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:ring-ring"
      >
        Pular para o conteúdo
      </a>
      <AppShell>
        <Outlet />
      </AppShell>
    </div>
  )
}
