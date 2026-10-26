import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/auth-dialog'

export const Route = createFileRoute('/entrar')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: LoginRoute,
})

function LoginRoute() {
  const { redirect } = Route.useSearch()
  return <AuthDialog mode="login" redirect={redirect} />
}
