import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import {
  ORDER_STATUS_LABELS,
  isTerminalStatus,
  type Order,
  type OrderStatus,
} from '@/entities/order'
import { NETWORK_LABELS } from '@/entities/nft'
import { WALLET_PROVIDER_LABELS } from '@/entities/auth'
import { formatEthExact } from '@/shared/money'
import { isApiError } from '@/shared/api'
import { queryKeys } from '@/shared/api/query-keys'
import { requireAuth } from '@/features/auth/guard'
import { fetchOrder } from '@/features/orders/api'
import { useOrderQuery } from '@/features/orders/queries'
import { Artwork } from '@/shared/ui/artwork'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock, SkeletonGroup } from '@/shared/ui/skeleton-primitives'
import { cn } from '@/shared/lib/utils'

/**
 * Order receipt.
 *
 * Renders the order snapshot taken at creation — never the live catalog — so a
 * later price change cannot alter a receipt. A pending order keeps polling
 * until it settles, which is how the outcome is recovered after a refresh or a
 * dropped connection without creating a second purchase.
 */
export const Route = createFileRoute('/pedido/$orderId')({
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: queryKeys.order('pending-owner', params.orderId),
        queryFn: ({ signal }) => fetchOrder(params.orderId, signal),
      })
    } catch (error) {
      if (
        isApiError(error) &&
        (error.code === 'NOT_FOUND' || error.code === 'FORBIDDEN')
      ) {
        throw notFound()
      }
      throw error
    }
  },
  component: OrderPage,
  pendingComponent: OrderPending,
})

function OrderPage() {
  const { orderId } = Route.useParams()
  const { data: order, isPending } = useOrderQuery(orderId)

  if (isPending || !order) return <OrderPending />

  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-8 px-5 py-6 lg:py-8">
      <h1 className="sr-only">Pedido {order.reference}</h1>

      <StatusBanner order={order} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
        <section aria-labelledby="items-heading" className="min-w-0">
          <h2 id="items-heading" className="text-body-xl font-bold text-foreground">
            Itens do pedido
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {order.items.map((item) => (
              <li
                key={`${item.nftId}-${item.editionId}`}
                className="flex items-center gap-3 rounded-md bg-card p-1 pr-4"
              >
                <Artwork
                  src={item.image}
                  alt={item.imageAlt}
                  className="size-[70px] rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-body-lg font-bold text-foreground">
                    {item.title}
                  </p>
                  <p className="truncate text-body text-brand-secondary">
                    {item.editionLabel} · {NETWORK_LABELS[item.network]}
                  </p>
                </div>
                <span className="shrink-0 text-body text-text-secondary">
                  (x {item.quantity})
                </span>
                <span className="shrink-0 text-body-2xl font-bold text-text-accent">
                  {formatEthExact(item.lineTotalEth)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="flex min-w-0 flex-col gap-6">
          <section>
            <h2 className="text-body-xl font-bold text-foreground">Resumo</h2>
            <dl className="mt-4 flex flex-col gap-3">
              <SummaryRow label="Subtotal" value={formatEthExact(order.subtotalEth)} />
              <SummaryRow
                label="Desconto"
                value={`(-) ${formatEthExact(order.discountEth)}`}
              />
              <SummaryRow
                label="Taxa de rede"
                value={formatEthExact(order.networkFeeEth)}
              />
              {order.coupon && <SummaryRow label="Cupom" value={order.coupon.code} />}
            </dl>
            <hr className="my-4 border-border" />
            <div className="flex items-center justify-between gap-3">
              <span className="text-body-lg font-bold text-foreground">Total</span>
              <span className="text-body-2xl font-bold text-text-accent">
                {formatEthExact(order.totalEth)}
              </span>
            </div>
          </section>

          <section>
            <h2 className="text-body-xl font-bold text-foreground">Transação</h2>
            <dl className="mt-4 flex flex-col gap-3">
              <SummaryRow label="Referência" value={order.reference} truncate />
              <SummaryRow
                label="Carteira"
                value={`${WALLET_PROVIDER_LABELS[order.wallet.provider]} · ${order.wallet.label}`}
                truncate
              />
              <SummaryRow label="Rede" value={NETWORK_LABELS[order.wallet.network]} />
              <SummaryRow label="Endereço" value={order.wallet.address} truncate />
            </dl>
            <p className="mt-3 text-caption text-text-secondary">
              Referência e link de exploração são simulados; nenhuma transação real foi
              submetida a uma blockchain.
            </p>
          </section>

          <div className="flex flex-col gap-3">
            <Button asChild variant="outline">
              <Link to="/" hash="catalogo">
                Continuar explorando
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  )
}

const BANNER_STYLES: Record<OrderStatus, string> = {
  pending: 'border-warning/50 bg-warning/10',
  confirmed: 'border-success/50 bg-success/10',
  declined: 'border-danger/50 bg-danger/10',
}

const BANNER_TEXT: Record<OrderStatus, string> = {
  pending: 'text-warning',
  confirmed: 'text-success',
  declined: 'text-danger',
}

function StatusBanner({ order }: { order: Order }) {
  const terminal = isTerminalStatus(order.status)

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-6',
        BANNER_STYLES[order.status],
      )}
    >
      <p
        className={cn(
          'text-body font-bold tracking-label uppercase',
          BANNER_TEXT[order.status],
        )}
      >
        {ORDER_STATUS_LABELS[order.status]}
      </p>

      <h2 className="text-heading font-bold text-foreground">
        {order.status === 'confirmed' && 'Compra confirmada'}
        {order.status === 'declined' && 'Pagamento recusado'}
        {order.status === 'pending' && 'Processando sua compra'}
      </h2>

      <p className="text-body text-text-secondary">
        {order.status === 'confirmed' &&
          'Os NFTs foram transferidos para a carteira selecionada na simulação.'}
        {order.status === 'declined' &&
          (order.declineReason ??
            'A carteira recusou a transação. Nenhum valor foi debitado.')}
        {order.status === 'pending' &&
          'Aguardando a confirmação da rede. Esta página atualiza sozinha e pode ser recarregada com segurança — o pedido não será duplicado.'}
      </p>

      {!terminal && (
        <p className="text-caption text-text-secondary">Pedido {order.reference}</p>
      )}

      {order.status === 'declined' && (
        <Button asChild variant="outline" className="mt-2 self-start">
          <Link to="/carrinho">Voltar ao carrinho</Link>
        </Button>
      )}
    </div>
  )
}

function SummaryRow({
  label,
  value,
  truncate = false,
}: {
  label: string
  value: string
  truncate?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="shrink-0 text-body-md text-text-secondary">{label}</dt>
      <dd
        className={cn(
          'min-w-0 text-right text-body-md text-foreground',
          truncate && 'truncate',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

function OrderPending() {
  return (
    <SkeletonGroup
      label="Carregando pedido"
      className="mx-auto w-full max-w-shell px-5 py-8"
    >
      <SkeletonBlock className="h-28 w-full" rounded="lg" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_405px]">
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, index) => (
            <li key={index}>
              <SkeletonBlock className="h-[78px] w-full" rounded="md" />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <SkeletonBlock className="h-5 w-32" />
          <SkeletonBlock className="h-5 w-full" />
          <SkeletonBlock className="h-5 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </div>
    </SkeletonGroup>
  )
}
