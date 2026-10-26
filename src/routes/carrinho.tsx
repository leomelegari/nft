import { createFileRoute } from '@tanstack/react-router'
import { useCartQuery } from '@/features/cart/queries'
import { formatEth } from '@/shared/money'
import { SkeletonGroup, SkeletonBlock } from '@/shared/ui/skeleton-primitives'

export const Route = createFileRoute('/carrinho')({
  component: CartPage,
})

function CartPage() {
  const { data: cart, isPending } = useCartQuery()

  if (isPending) {
    return (
      <SkeletonGroup
        label="Carregando carrinho"
        className="mx-auto w-full max-w-shell px-5 py-10"
      >
        <SkeletonBlock className="h-8 w-48" />
        <SkeletonBlock className="mt-6 h-32 w-full" rounded="lg" />
      </SkeletonGroup>
    )
  }

  return (
    <div className="mx-auto w-full max-w-shell px-5 py-10">
      <h1 className="text-heading font-bold text-foreground">Carrinho de NFTs</h1>
      <ul className="mt-6 flex flex-col gap-4">
        {cart?.items.map((item) => (
          <li
            key={item.id}
            className="flex items-center justify-between rounded-xl bg-card p-4"
          >
            <span className="text-body text-foreground">
              {item.title} — {item.editionLabel} × {item.quantity}
            </span>
            <span className="text-body font-bold text-text-accent">
              {formatEth(item.lineTotalEth)}
            </span>
          </li>
        ))}
      </ul>
      {cart?.items.length === 0 && (
        <p className="mt-6 text-body text-text-secondary">Seu carrinho está vazio.</p>
      )}
    </div>
  )
}
