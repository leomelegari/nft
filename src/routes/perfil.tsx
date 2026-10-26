import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { useCurrentUser } from '@/features/auth/queries'

export const Route = createFileRoute('/perfil')({
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: ProfilePage,
})

function ProfilePage() {
  const user = useCurrentUser()

  return (
    <div className="mx-auto w-full max-w-shell px-5 py-10">
      <h1 className="text-heading font-bold text-foreground">Perfil do colecionador</h1>
      <p className="mt-4 text-body text-text-secondary">{user?.email}</p>
    </div>
  )
}
