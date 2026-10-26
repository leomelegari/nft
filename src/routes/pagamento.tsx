import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'

export const Route = createFileRoute('/pagamento')({
  // Checkout requires a session; an expired one returns here after sign-in.
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: CheckoutPage,
})

function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-shell px-5 py-10">
      <h1 className="text-heading font-bold text-foreground">Pagamento</h1>
    </div>
  )
}
