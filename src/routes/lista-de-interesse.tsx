import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { useFavoritesQuery } from '@/features/favorites/queries'
import { AccountLayout } from '@/features/account/account-layout'
import { FavoritesList } from '@/features/favorites/favorites-list'

/**
 * Lista de interesse — the account's saved NFTs.
 *
 * Favourites were already required to persist for an authenticated user, and
 * the control to save one existed on every card, but there was nowhere to see
 * what had been saved. This is that screen, sharing the account sidebar with
 * the profile and wallets.
 */
export const Route = createFileRoute('/lista-de-interesse')({
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: WishlistPage,
})

function WishlistPage() {
  const favorites = useFavoritesQuery()
  const items = favorites.data?.data ?? []

  return (
    <AccountLayout title="Lista de interesse">
      <p className="text-body-md text-text-secondary">
        {items.length === 0
          ? 'Os NFTs que você favoritar aparecem aqui.'
          : `${items.length} ${items.length === 1 ? 'NFT salvo' : 'NFTs salvos'}.`}
      </p>

      <FavoritesList
        nfts={items}
        isPending={favorites.isPending}
        isFetching={favorites.isFetching && !favorites.isPending}
        error={favorites.error}
        onRetry={() => void favorites.refetch()}
      />
    </AccountLayout>
  )
}
