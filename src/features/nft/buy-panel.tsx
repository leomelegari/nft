import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import type { NftDetail, NftEdition } from '@/entities/nft'
import { isApiError } from '@/shared/api'
import { useAddToCart } from '@/features/cart/queries'
import { EditionSelector } from '@/features/nft/edition-selector'
import { QuantityStepper } from '@/features/nft/quantity-stepper'
import { FavoriteButton } from '@/features/favorites/favorite-button'
import { Button } from '@/shared/ui/button'

/**
 * Edition, quantity and purchase controls.
 *
 * The quantity ceiling is the lower of remaining availability and the
 * per-order limit, recomputed when the edition changes; switching to an
 * edition with less stock clamps the quantity instead of letting an
 * impossible value reach the server.
 */
export function BuyPanel({ nft }: { nft: NftDetail }) {
  const firstAvailable =
    nft.editions.find((edition) => edition.available > 0) ?? nft.editions[0]

  const [editionId, setEditionId] = useState(firstAvailable?.id ?? '')
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState<{
    kind: 'success' | 'error'
    message: string
  } | null>(null)

  const addToCart = useAddToCart()

  const edition: NftEdition | undefined =
    nft.editions.find((item) => item.id === editionId) ?? firstAvailable

  const max = edition ? Math.min(edition.available, edition.maxPerOrder) : 0
  const soldOut = !edition || edition.available === 0

  function selectEdition(nextId: string) {
    setEditionId(nextId)
    setFeedback(null)

    const next = nft.editions.find((item) => item.id === nextId)
    if (!next) return
    const nextMax = Math.min(next.available, next.maxPerOrder)
    if (quantity > nextMax) setQuantity(Math.max(1, nextMax))
  }

  function submit() {
    if (!edition) return
    setFeedback(null)

    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity },
      {
        onSuccess: () =>
          setFeedback({
            kind: 'success',
            message: `${quantity} ${quantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'} ao carrinho.`,
          }),
        onError: (error) =>
          setFeedback({
            kind: 'error',
            message: isApiError(error)
              ? error.message
              : 'Não foi possível adicionar ao carrinho.',
          }),
      },
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <EditionSelector
        editions={nft.editions}
        selectedId={edition?.id ?? ''}
        onSelect={selectEdition}
      />

      <div className="flex flex-wrap items-center gap-4">
        <QuantityStepper
          value={quantity}
          max={Math.max(1, max)}
          disabled={soldOut}
          onChange={setQuantity}
        />

        <div className="flex flex-wrap items-start gap-2">
          <Button
            onClick={submit}
            disabled={soldOut || addToCart.isPending}
            className="h-10 min-w-[130px] font-bold tracking-wide"
          >
            {addToCart.isPending ? 'ADICIONANDO…' : soldOut ? 'ESGOTADO' : 'COMPRAR'}
          </Button>

          <FavoriteButton nft={nft} variant="full" />
        </div>
      </div>

      {edition && !soldOut && (
        <p className="text-caption-lg text-text-secondary">
          {max === edition.maxPerOrder
            ? `Limite de ${edition.maxPerOrder} unidades por pedido.`
            : `Restam ${edition.available} unidades desta edição.`}
        </p>
      )}

      {feedback && (
        <div
          role={feedback.kind === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          className={
            feedback.kind === 'error'
              ? 'text-body text-danger'
              : 'flex flex-wrap items-center gap-2 text-body text-success'
          }
        >
          {feedback.message}
          {feedback.kind === 'success' && (
            <Link to="/carrinho" className="text-text-accent underline">
              Ver carrinho
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
