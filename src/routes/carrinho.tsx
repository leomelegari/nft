import { useCallback } from 'react'
import { z } from 'zod'
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCartQuery, useQuoteQuery } from '@/features/cart/queries'
import { CartRow } from '@/features/cart/cart-row'
import { CartSummary } from '@/features/cart/cart-summary'
import { isApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock, SkeletonGroup } from '@/shared/ui/skeleton-primitives'

/**
 * Cart screen.
 *
 * The applied coupon lives in the URL (`?cupom=`) rather than component state,
 * so it survives a refresh and is restored by back/forward alongside the cart
 * itself — the cart must persist across refresh and the coupon is part of what
 * the user applied.
 */
export const Route = createFileRoute('/carrinho')({
  validateSearch: z.object({ cupom: z.string().optional().catch(undefined) }),
  component: CartPage,
})

function CartPage() {
  const { cupom } = Route.useSearch()
  const navigate = useNavigate({ from: '/carrinho' })

  const cart = useCartQuery()
  const quote = useQuoteQuery(cupom)

  const applyCoupon = useCallback(
    (code: string) => {
      void navigate({ search: code ? { cupom: code } : {}, replace: true })
    },
    [navigate],
  )

  const items = cart.data?.items ?? []
  const hasUnavailable = items.some((item) => item.available < item.quantity)

  if (cart.isPending) return <CartPending />

  if (cart.error) {
    return (
      <div className="mx-auto w-full max-w-shell px-5 py-10">
        <div
          role="alert"
          className="flex flex-col items-center gap-4 rounded-xl border border-border-soft bg-card p-10 text-center"
        >
          <h1 className="text-body-2xl font-bold text-foreground">
            Não foi possível carregar seu carrinho
          </h1>
          <p className="text-body text-text-secondary">
            {isApiError(cart.error) ? cart.error.message : 'Tente novamente.'}
          </p>
          <Button onClick={() => void cart.refetch()}>Tentar novamente</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-8 px-5 py-6 lg:py-8">
      <Breadcrumb />

      <h1 className="sr-only">Carrinho de NFTs</h1>

      {items.length === 0 ? (
        <EmptyCart />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
          <section aria-labelledby="items-heading" className="min-w-0">
            <h2 id="items-heading" className="sr-only">
              Itens no carrinho
            </h2>

            {/*
              Column labels for the desktop table. The Figma labels the quantity
              column "Edições"; the edition is shown under each title instead,
              and the column is named for what it actually controls.
            */}
            <div className="hidden grid-cols-[70px_minmax(0,1fr)_7rem_9rem_7rem_2.5rem] items-center gap-5 pr-6 pb-3 text-body-lg font-bold text-foreground lg:grid">
              <span className="col-span-2">NFTs</span>
              <span className="font-medium">Preço</span>
              <span>Quantidade</span>
              <span className="font-medium">Total</span>
              <span className="sr-only">Remover</span>
            </div>
            <hr className="hidden border-border lg:block" />

            <ul className="mt-3 flex flex-col gap-3">
              {items.map((item) => (
                <CartRow key={item.id} item={item} />
              ))}
            </ul>
          </section>

          <CartSummary
            quote={quote.data}
            isLoading={quote.isPending || quote.isFetching}
            error={quote.error}
            appliedCoupon={cupom}
            onApplyCoupon={applyCoupon}
            onRemoveCoupon={() => applyCoupon('')}
            checkoutDisabled={hasUnavailable || Boolean(quote.error) || !quote.data}
          />
        </div>
      )}
    </div>
  )
}

function Breadcrumb() {
  return (
    <nav aria-label="Trilha de navegação">
      <ol className="flex items-center gap-2 text-body-md font-bold text-foreground">
        <li>
          <Link to="/" className="rounded-sm transition-colors hover:text-text-accent">
            Início
          </Link>
        </li>
        <li aria-hidden="true" className="text-text-secondary">
          /
        </li>
        <li>
          <Link
            to="/"
            hash="catalogo"
            className="rounded-sm transition-colors hover:text-text-accent"
          >
            Mercado
          </Link>
        </li>
        <li aria-hidden="true" className="text-text-secondary">
          /
        </li>
        <li className="font-normal text-text-secondary">Carrinho</li>
      </ol>
    </nav>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border-soft bg-card p-12 text-center">
      <h2 className="text-body-2xl font-bold text-foreground">Seu carrinho está vazio</h2>
      <p className="max-w-prose text-body text-text-secondary">
        Explore o catálogo e adicione NFTs para continuar.
      </p>
      <Button asChild>
        <Link to="/" hash="catalogo">
          Explorar o catálogo
        </Link>
      </Button>
    </div>
  )
}

function CartPending() {
  return (
    <SkeletonGroup
      label="Carregando carrinho"
      className="mx-auto w-full max-w-shell px-5 py-8"
    >
      <SkeletonBlock className="h-4 w-56" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_332px]">
        <ul className="flex flex-col gap-3">
          {Array.from({ length: 3 }, (_, index) => (
            <li key={index}>
              <SkeletonBlock className="h-[70px] w-full" rounded="md" />
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-4">
          <SkeletonBlock className="h-5 w-48" />
          <SkeletonBlock className="h-10 w-full" />
          <SkeletonBlock className="h-5 w-full" />
          <SkeletonBlock className="h-5 w-full" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      </div>
    </SkeletonGroup>
  )
}
