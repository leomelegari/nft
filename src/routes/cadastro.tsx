import { z } from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { AuthDialog } from '@/features/auth/auth-dialog'

export const Route = createFileRoute('/cadastro')({
  validateSearch: z.object({ redirect: z.string().optional().catch(undefined) }),
  component: RegisterRoute,
})

function RegisterRoute() {
  const { redirect } = Route.useSearch()
  return <AuthDialog mode="register" redirect={redirect} />
}
