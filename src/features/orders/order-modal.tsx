import { Link } from '@tanstack/react-router'
import ThankYouIllustration from '@/assets/brand/thank-you.svg?react'
import { NETWORK_LABELS } from '@/entities/nft'
import { WALLET_PROVIDER_LABELS } from '@/entities/auth'
import type { Order, OrderStatus } from '@/entities/order'
import { formatEthExact } from '@/shared/money'
import { Artwork } from '@/shared/ui/artwork'
import { Button } from '@/shared/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'

/**
 * Order outcome modal.
 *
 * Opens as soon as the order exists — while it is still `pending` — and then
 * follows it: the headline, the illustration and the closing action change as
 * the simulated settlement resolves, while the receipt below them stays put.
 * That ordering is deliberate. The snapshot is already final at creation; only
 * the outcome is still unknown, so re-rendering the whole panel on settlement
 * would suggest the numbers had changed too.
 *
 * The receipt page sits behind it, so dismissing the modal is never a dead
 * end — the same information is on the page underneath.
 */
export function OrderModal({
  order,
  open,
  onOpenChange,
}: {
  order: Order
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const tone = TONE[order.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto border-border-soft bg-card p-0 sm:max-w-[578px]">
        <header className="flex flex-col items-center justify-center gap-4 px-10 py-8">
          <OrderStatusIcon status={order.status} />

          <DialogTitle className={cn('text-center text-body-xl font-bold', tone.title)}>
            {HEADLINE[order.status]}
          </DialogTitle>
        </header>

        <div className="h-px w-full bg-primary" />

        <TransactionMeta order={order} />

        <div className="h-px w-full bg-primary" />

        <div className="flex flex-col gap-3 px-6 pt-5 pb-10 sm:px-11">
          <h3 className="text-body-md font-bold text-foreground">
            Detalhes da transação
          </h3>

          <ItemsTable order={order} />
          <Totals order={order} />

          <hr className="mt-2 border-border-soft" />

          <DialogDescription className="text-center text-body text-text-secondary">
            {order.status === 'confirmed' &&
              `Transação confirmada na ${NETWORK_LABELS[order.wallet.network]}. A propriedade foi transferida para sua carteira conectada e registrada na rede.`}
            {order.status === 'pending' &&
              'Aguardando a confirmação da rede. Esta janela se atualiza sozinha e pode ser fechada com segurança — o pedido não será duplicado.'}
            {order.status === 'declined' &&
              (order.declineReason ??
                'A carteira recusou a transação. Nenhum valor foi debitado.')}
          </DialogDescription>

          <OrderModalAction order={order} onClose={() => onOpenChange(false)} />
        </div>

        <div className="h-2.5 w-full shrink-0 bg-primary" />
      </DialogContent>
    </Dialog>
  )
}

const HEADLINE: Record<OrderStatus, string> = {
  pending: 'Processando sua compra',
  confirmed: 'Seus NFTs agora estão na sua carteira',
  declined: 'Pagamento recusado',
}

const TONE: Record<OrderStatus, { title: string; icon: string }> = {
  pending: { title: 'text-text-secondary', icon: 'text-warning' },
  confirmed: { title: 'text-text-secondary', icon: 'text-primary' },
  declined: { title: 'text-danger', icon: 'text-danger' },
}

/**
 * The confirmed state uses the illustration from the file. The other two are
 * not drawn there, so they borrow the same 80px slot and the project's
 * existing status colours rather than inventing a second visual language.
 */
function OrderStatusIcon({ status }: { status: OrderStatus }) {
  if (status === 'confirmed') {
    return (
      <ThankYouIllustration
        aria-hidden="true"
        className={cn('h-20 w-auto', TONE.confirmed.icon)}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-20 items-center justify-center rounded-full border-2',
        status === 'pending' ? 'border-warning/40' : 'border-danger/40',
      )}
    >
      {status === 'pending' ? (
        // `motion-safe` so the spin is dropped under reduced motion; the ring
        // still reads as a status without it.
        <span className="size-8 rounded-full border-2 border-warning/30 border-t-warning motion-safe:animate-spin" />
      ) : (
        <svg viewBox="0 0 24 24" className="size-9 text-danger" fill="none">
          <path
            d="M12 7v6m0 4h.01M10.3 3.9 2.6 17.1A2 2 0 0 0 4.3 20h15.4a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0Z"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </span>
  )
}

/** The four-column strip: reference, date, total and wallet. */
function TransactionMeta({ order }: { order: Order }) {
  const entries = [
    { label: 'ID da transação', value: shortenReference(order.reference) },
    { label: 'Data', value: formatOrderDate(order.settledAt ?? order.createdAt) },
    { label: 'Total', value: formatEthExact(order.totalEth) },
    { label: 'Carteira', value: WALLET_PROVIDER_LABELS[order.wallet.provider] },
  ]

  return (
    <dl className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-6 py-3 sm:px-9">
      {entries.map((entry, index) => (
        <div
          key={entry.label}
          className={cn(
            'flex min-w-0 flex-col',
            // The rule only separates columns that are side by side; once the
            // strip wraps it would start a row with a stray divider.
            index > 0 && 'sm:border-l sm:border-border-soft sm:pl-4',
          )}
        >
          <dt className="text-caption-lg font-bold text-text-secondary">{entry.label}</dt>
          <dd className="truncate text-body-md text-text-secondary">{entry.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function ItemsTable({ order }: { order: Order }) {
  return (
    <section aria-label="Itens do pedido" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4 text-body-md text-foreground">
        <span className="font-bold">NFTs</span>
        <span className="flex shrink-0 items-center gap-6">
          <span className="font-bold">Edições</span>
          <span className="font-medium">Subtotal</span>
        </span>
      </div>

      <hr className="border-border-soft" />

      <ul className="flex flex-col gap-3">
        {order.items.map((item) => (
          <li key={`${item.nftId}-${item.editionId}`} className="flex items-center gap-3">
            <Artwork
              src={item.image}
              alt={item.imageAlt}
              className="size-14 shrink-0 rounded-lg sm:size-[70px]"
            />

            {/*
              Below `sm` the quantity and subtotal drop to their own line
              instead of competing with the title: squeezed into one row at
              390px the name truncated to "Golden…".
            */}
            <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="min-w-0">
                <p className="truncate text-body-md font-bold text-foreground">
                  {item.title}
                </p>
                <p className="truncate text-body text-brand-secondary">
                  ID do token: #{item.nftId.replace(/\D/g, '')}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-4 sm:gap-8">
                <span className="text-body text-text-secondary">(x {item.quantity})</span>
                <span className="text-body-2xl font-bold text-text-accent">
                  {formatEthExact(item.lineTotalEth)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * Totals.
 *
 * The file draws only "Taxa de rede" and "Total", which closes arithmetically
 * for an order with no coupon. With one, it did not: the line items plus the
 * fee visibly exceeded the total, and the discount that explained the gap was
 * nowhere on the panel. Subtotal and the discount appear only when there *is*
 * a discount, so an order without a coupon still renders the layout the design
 * specifies.
 */
function Totals({ order }: { order: Order }) {
  const hasDiscount = Number(order.discountEth) > 0

  return (
    <dl className="flex w-full flex-col justify-between gap-3">
      {hasDiscount && (
        <>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-body-md text-foreground">Subtotal</dt>
            <dd className="text-body-2xl text-foreground">
              {formatEthExact(order.subtotalEth)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="min-w-0 text-body-md text-foreground">
              Desconto
              {order.coupon && (
                <span className="ml-1.5 text-caption text-text-secondary">
                  {order.coupon.code}
                </span>
              )}
            </dt>
            <dd className="text-body-2xl whitespace-nowrap text-success">
              (-) {formatEthExact(order.discountEth)}
            </dd>
          </div>
        </>
      )}

      <div className="flex items-center justify-between gap-4">
        <dt className="text-body-md text-foreground">Taxa de rede</dt>
        <dd className="text-body-2xl text-foreground">
          {formatEthExact(order.networkFeeEth)}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-body-md font-bold text-foreground">Total</dt>
        <dd className="text-body-2xl font-bold text-text-accent">
          {formatEthExact(order.totalEth)}
        </dd>
      </div>
    </dl>
  )
}

/**
 * Closing action.
 *
 * The design's "Ver no Etherscan" is kept on a confirmed order but stays
 * inert: the reference and the explorer URL are simulated, and a button that
 * navigates to a address that does not resolve would be exactly the "aparentar
 * sucesso funcional" the brief forbids. The note under it says so.
 */
function OrderModalAction({ order, onClose }: { order: Order; onClose: () => void }) {
  if (order.status === 'declined') {
    return (
      <Button asChild className="mt-2 self-center px-6">
        <Link to="/carrinho" onClick={onClose}>
          Voltar ao carrinho
        </Link>
      </Button>
    )
  }

  if (order.status === 'pending') {
    return (
      <Button variant="outline" onClick={onClose} className="mt-2 self-center px-6">
        Acompanhar na página do pedido
      </Button>
    )
  }

  return (
    <div className="mt-2 flex flex-col items-center gap-2">
      <span
        aria-disabled="true"
        title="Link de exploração simulado"
        className="cursor-not-allowed rounded-[5px] bg-primary/60 px-4 py-3 text-body-md font-bold text-primary-foreground"
      >
        Ver no Etherscan
      </span>
    </div>
  )
}

/** `0xA91F…E82C` — the design's shortened form. */
function shortenReference(reference: string): string {
  if (reference.length <= 12) return reference
  return `${reference.slice(0, 6)}…${reference.slice(-4)}`
}

/** `29 Jul, 2026`, matching the file rather than the pt-BR long form. */
function formatOrderDate(iso: string): string {
  const date = new Date(iso)
  const parts = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).formatToParts(date)

  const find = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? ''

  const month = find('month').replace('.', '')
  return `${find('day')} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${find('year')}`
}
