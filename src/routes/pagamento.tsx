import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { collectorInputSchema, type CollectorInput } from '@/entities/order'
import { requireAuth } from '@/features/auth/guard'
import { useCurrentUser } from '@/features/auth/queries'
import { useCartQuery, useQuoteQuery } from '@/features/cart/queries'
import { useWalletsQuery } from '@/features/account/queries'
import { useWalletConnection } from '@/features/checkout/wallet-connection'
import { useCheckout } from '@/features/checkout/use-checkout'
import { CollectorForm } from '@/features/checkout/collector-form'
import { WalletSelector } from '@/features/checkout/wallet-selector'
import { ConnectPrompt } from '@/features/checkout/connect-prompt'
import { QuoteIssuesNotice, ReviewSummary } from '@/features/checkout/review-summary'
import { useZodForm } from '@/shared/lib/use-zod-form'
import { Button } from '@/shared/ui/button'
import { FormError } from '@/shared/ui/form-field'

export const Route = createFileRoute('/pagamento')({
  validateSearch: z.object({ cupom: z.string().optional().catch(undefined) }),
  // Checkout requires a session; an expired one returns here after sign-in.
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: CheckoutPage,
})

const EMPTY_COLLECTOR: CollectorInput = {
  displayName: '',
  username: '',
  email: '',
  profileName: '',
  referralCode: '',
  note: '',
}

function CheckoutPage() {
  const { cupom } = Route.useSearch()
  const navigate = useNavigate()
  const user = useCurrentUser()

  const cart = useCartQuery()
  const quote = useQuoteQuery(cupom)
  const wallets = useWalletsQuery()
  const connection = useWalletConnection()
  const checkout = useCheckout(cupom)
  const form = useZodForm(collectorInputSchema)

  // Prefill from the signed-in account; the user can still edit before paying.
  // Derived during render rather than copied into state by an effect: `edits`
  // holds only what the user actually changed.
  const prefilled = useMemo<CollectorInput>(
    () =>
      user
        ? {
            ...EMPTY_COLLECTOR,
            displayName: user.name,
            username: user.email.split('@')[0] ?? '',
            email: user.email,
          }
        : EMPTY_COLLECTOR,
    [user],
  )

  const [edits, setEdits] = useState<Partial<CollectorInput>>({})
  const collector: CollectorInput = { ...prefilled, ...edits }

  // Selection falls back to the first wallet, so no effect is needed to seed it.
  const [walletId, setWalletId] = useState<string | null>(null)
  const walletList = wallets.data ?? []
  const selectedWallet = walletList.find((item) => item.id === walletId) ?? walletList[0]

  // A confirmed or declined order is terminal; go straight to its receipt.
  useEffect(() => {
    if (checkout.order) {
      void navigate({
        to: '/pedido/$orderId',
        params: { orderId: checkout.order.id },
        replace: true,
      })
    }
  }, [checkout.order, navigate])

  const items = cart.data?.items ?? []
  const connected =
    connection.isConnected && connection.connectedWalletId === selectedWallet?.id

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const values = form.validate(collector)
    if (!values || !selectedWallet) return

    checkout.submit({
      collector: values,
      walletId: selectedWallet.id,
      network: selectedWallet.network,
    })
  }

  if (!cart.isPending && items.length === 0) {
    return (
      <div className="mx-auto w-full max-w-shell px-5 py-10">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-border-soft bg-card p-12 text-center">
          <h1 className="text-body-2xl font-bold text-foreground">
            Não há itens para finalizar
          </h1>
          <p className="text-body text-text-secondary">
            Seu carrinho está vazio. Adicione NFTs para continuar.
          </p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar o catálogo
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  const canSubmit =
    connected && Boolean(selectedWallet) && !checkout.isSubmitting && items.length > 0

  return (
    <form
      onSubmit={submit}
      noValidate
      className="mx-auto flex w-full max-w-shell flex-col gap-8 px-5 py-6 lg:py-8"
    >
      <nav aria-label="Trilha de navegação">
        <ol className="flex items-center gap-2 text-body-md font-bold text-foreground">
          <li>
            <Link to="/" className="rounded-sm hover:text-text-accent">
              Início
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-secondary">
            /
          </li>
          <li>
            <Link to="/carrinho" className="rounded-sm hover:text-text-accent">
              Carrinho
            </Link>
          </li>
          <li aria-hidden="true" className="text-text-secondary">
            /
          </li>
          <li className="font-normal text-text-secondary">Pagamento</li>
        </ol>
      </nav>

      <h1 className="sr-only">Pagamento</h1>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
        <CollectorForm
          values={collector}
          errors={form.fieldErrors}
          onChange={(key, value) => {
            setEdits((current) => ({ ...current, [key]: value }))
            form.clearField(key)
          }}
        />

        <div className="flex min-w-0 flex-col gap-6">
          <ReviewSummary
            cart={cart.data}
            quote={quote.data}
            isLoading={quote.isPending || quote.isFetching}
          />

          <WalletSelector
            wallets={walletList}
            isLoading={wallets.isPending}
            selectedId={selectedWallet?.id ?? null}
            onSelect={(id) => {
              setWalletId(id)
              // Switching wallets invalidates the previous approval.
              connection.disconnect()
            }}
            connectionStatus={connection.status}
            connectedWalletId={connection.connectedWalletId}
            onConnect={() =>
              selectedWallet && connection.requestConnection(selectedWallet)
            }
            onDisconnect={connection.disconnect}
          />

          {checkout.block.kind === 'quote-stale' && (
            <QuoteIssuesNotice
              issues={checkout.block.quote.issues}
              message={checkout.block.message}
              onAcknowledge={checkout.acknowledge}
            />
          )}

          {(checkout.block.kind === 'error' ||
            checkout.block.kind === 'availability') && (
            <FormError message={checkout.block.message} />
          )}

          <FormError message={form.formError} />

          <Button
            type="submit"
            disabled={!canSubmit}
            className="h-[45px] w-full rounded-lg font-bold"
          >
            {checkout.isSubmitting ? 'Confirmando…' : 'Confirmar compra'}
          </Button>

          {!connected && (
            <p className="text-center text-caption-lg text-text-secondary">
              Conecte a carteira selecionada para habilitar a confirmação.
            </p>
          )}
        </div>
      </div>

      <ConnectPrompt
        wallet={connection.pending}
        open={connection.status === 'connecting'}
        onApprove={connection.approve}
        onRefuse={connection.refuse}
      />
    </form>
  )
}
