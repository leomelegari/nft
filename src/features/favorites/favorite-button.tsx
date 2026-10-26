import { useState } from 'react'
import type { NftSummary } from '@/entities/nft'
import { isApiError } from '@/shared/api'
import { useIsAuthenticated } from '@/features/auth/queries'
import { useIsFavorite, useToggleFavorite } from '@/features/favorites/queries'
import { cn } from '@/shared/lib/utils'

/**
 * Favourite toggle.
 *
 * The mutation is optimistic with rollback (see `useToggleFavorite`). When the
 * rollback happens the user is told why, because a heart that silently flips
 * back looks like a bug rather than a failure.
 *
 * Favourites require a session, so an anonymous visitor gets an explanation
 * instead of a request that is guaranteed to 401.
 */
export function FavoriteButton({
  nft,
  variant = 'icon',
  onRequireAuth,
}: {
  nft: NftSummary
  variant?: 'icon' | 'full'
  onRequireAuth?: () => void
}) {
  const isAuthenticated = useIsAuthenticated()
  const isFavorite = useIsFavorite(nft.id)
  const toggle = useToggleFavorite()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)

    if (!isAuthenticated) {
      onRequireAuth?.()
      setError('Entre na sua conta para salvar favoritos.')
      return
    }

    toggle.mutate(
      { nftId: nft.id, next: !isFavorite, summary: nft },
      {
        onError: (mutationError) => {
          setError(
            isApiError(mutationError)
              ? mutationError.message
              : 'Não foi possível atualizar seus favoritos.',
          )
        },
      },
    )
  }

  const label = isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'

  if (variant === 'icon') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          aria-pressed={isFavorite}
          aria-label={`${label}: ${nft.title}`}
          className={cn(
            'relative z-10 flex size-9 items-center justify-center rounded-full bg-ink/70 backdrop-blur-sm transition-colors focus-visible:outline-ring',
            isFavorite ? 'text-text-accent' : 'text-text-secondary hover:text-foreground',
          )}
        >
          <HeartGlyph filled={isFavorite} />
        </button>
        {error && <span className="sr-only">{error}</span>}
      </>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClick}
        aria-pressed={isFavorite}
        className={cn(
          'flex h-10 items-center justify-center gap-2 rounded-md border border-primary px-4 text-body font-medium transition-colors focus-visible:outline-ring',
          isFavorite
            ? 'bg-primary text-primary-foreground'
            : 'text-text-accent hover:bg-primary/10',
        )}
      >
        <HeartGlyph filled={isFavorite} />
        {isFavorite ? 'Favoritado' : 'Favoritar'}
      </button>
      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function HeartGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden="true" fill="none">
      <path
        d="M10 17s-6.5-4.2-6.5-8.3A3.7 3.7 0 0 1 10 6.2a3.7 3.7 0 0 1 6.5 2.5C16.5 12.8 10 17 10 17Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
        fill={filled ? 'currentColor' : 'none'}
      />
    </svg>
  )
}
