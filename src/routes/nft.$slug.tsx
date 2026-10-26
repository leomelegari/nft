import { createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/shared/api/query-keys'
import { fetchNftDetail } from '@/features/catalog/api'
import { isApiError } from '@/shared/api'
import {
  SkeletonGroup,
  SkeletonBlock,
  SkeletonText,
} from '@/shared/ui/skeleton-primitives'
import { Artwork } from '@/shared/ui/artwork'
import { formatEth } from '@/shared/money'

export const Route = createFileRoute('/nft/$slug')({
  // Direct access and refresh must work, so the detail is prefetched in the
  // loader and a missing NFT becomes a router 404 rather than a render error.
  loader: async ({ context, params }) => {
    try {
      await context.queryClient.ensureQueryData({
        queryKey: queryKeys.nfts.detail(params.slug),
        queryFn: ({ signal }) => fetchNftDetail(params.slug, signal),
      })
    } catch (error) {
      if (isApiError(error) && error.code === 'NOT_FOUND') throw notFound()
      throw error
    }
  },
  component: NftDetailPage,
  pendingComponent: NftDetailPending,
})

function NftDetailPage() {
  const { slug } = Route.useParams()
  const { data: nft } = useQuery({
    queryKey: queryKeys.nfts.detail(slug),
    queryFn: ({ signal }) => fetchNftDetail(slug, signal),
  })

  if (!nft) return <NftDetailPending />

  return (
    <div className="mx-auto w-full max-w-shell px-5 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-card p-2">
          <Artwork
            src={nft.image}
            alt={nft.imageAlt}
            size="detail"
            priority
            className="rounded-xl"
          />
        </div>
        <div>
          <h1 className="text-heading font-bold text-foreground">{nft.title}</h1>
          <p className="mt-3 text-body-2xl font-bold text-text-accent">
            {formatEth(nft.priceEth)}
          </p>
          <p className="mt-6 text-body leading-6 text-text-secondary">
            {nft.description}
          </p>
        </div>
      </div>
    </div>
  )
}

function NftDetailPending() {
  return (
    <SkeletonGroup
      label="Carregando detalhes do NFT"
      className="mx-auto w-full max-w-shell px-5 py-10"
    >
      <div className="grid gap-10 lg:grid-cols-2">
        <SkeletonBlock className="aspect-square w-full" rounded="lg" />
        <div>
          <SkeletonBlock className="h-7 w-2/3" />
          <SkeletonBlock className="mt-3 h-6 w-1/4" />
          <SkeletonText lines={4} className="mt-6" />
        </div>
      </div>
    </SkeletonGroup>
  )
}
