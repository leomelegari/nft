import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: WalletsPage,
})

function WalletsPage() {
  return (
    <div className="mx-auto w-full max-w-shell px-5 py-10">
      <h1 className="text-heading font-bold text-foreground">Carteiras</h1>
    </div>
  )
}
