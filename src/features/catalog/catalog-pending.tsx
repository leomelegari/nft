import { NftCardSkeleton } from '@/features/catalog/nft-card'
import { DEFAULT_PAGE_SIZE } from '@/features/catalog/search-params'
import { DEFAULT_MARKET_PAGE_SIZE } from '@/features/catalog/market/market-search-params'
import { SkeletonBlock, SkeletonGroup } from '@/shared/ui/skeleton-primitives'

/**
 * Route-level skeletons for the two listing screens.
 *
 * The grids already render skeletons while their query is pending, but on a
 * route transition the loader resolves *before* the component mounts, so that
 * state is never reached: on a slow connection the screen simply stayed blank
 * for the whole wait. These are what the router shows in the meantime, and
 * they reserve the same boxes the real content occupies.
 */
export function HomePending() {
  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-10 px-5 py-6 lg:py-8">
      <SkeletonGroup label="Carregando a página inicial">
        <SkeletonBlock className="h-[320px] w-full" rounded="lg" />

        <div className="mt-10 grid gap-8 lg:grid-cols-[310px_1fr]">
          <SkeletonBlock className="hidden h-[520px] w-full lg:block" rounded="lg" />

          <div className="flex min-w-0 flex-col gap-6">
            <SkeletonBlock className="h-9 w-full max-w-md" />
            <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
              {Array.from({ length: DEFAULT_PAGE_SIZE }, (_, index) => (
                <li key={index}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </SkeletonGroup>
    </div>
  )
}

export function MarketPending() {
  return (
    <div className="mx-auto flex w-full max-w-shell flex-col gap-6 px-5 py-6 lg:py-8">
      <SkeletonGroup label="Carregando itens do mercado">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-8 w-48" />
          <SkeletonBlock className="h-4 w-full max-w-prose" />
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonBlock key={index} className="h-[72px] w-full" rounded="lg" />
          ))}
        </div>

        <SkeletonBlock className="mt-6 h-[74px] w-full" rounded="lg" />

        <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-7 sm:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: DEFAULT_MARKET_PAGE_SIZE }, (_, index) => (
            <li key={index}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      </SkeletonGroup>
    </div>
  )
}
