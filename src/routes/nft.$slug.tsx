import { Link, createFileRoute, notFound } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import {
  COLLECTION_LABELS,
  NETWORK_LABELS,
  type NftDetail,
  type NftSummary,
} from '@/entities/nft'
import { queryKeys } from '@/shared/api/query-keys'
import { isApiError } from '@/shared/api'
import { fetchNftDetail, fetchNfts } from '@/features/catalog/api'
import { NftCard, NftCardSkeleton } from '@/features/catalog/nft-card'
import { NftGallery } from '@/features/nft/gallery'
import { NftRating } from '@/features/nft/rating'
import { BuyPanel } from '@/features/nft/buy-panel'
import { formatEth } from '@/shared/money'
import {
  SkeletonBlock,
  SkeletonGroup,
  SkeletonText,
} from '@/shared/ui/skeleton-primitives'

export const Route = createFileRoute('/nft/$slug')({
  /**
   * Direct access and refresh must work on every screen, so the detail is
   * resolved in the loader. A missing NFT becomes a router 404 rather than an
   * error boundary, which is what the brief asks for.
   */
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
    <div className="mx-auto flex w-full max-w-shell flex-col gap-12 px-5 py-6 lg:py-8">
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
          <li className="truncate font-normal text-text-secondary">{nft.title}</li>
        </ol>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[573px_minmax(0,1fr)]">
        <NftGallery images={nft.gallery} title={nft.title} />

        <div className="flex min-w-0 flex-col gap-6">
          <div>
            <h1 className="text-[28px] leading-tight font-bold text-foreground">
              {nft.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-[22px] font-bold text-text-accent">
                {formatEth(nft.priceEth)}
              </p>
              <NftRating rating={nft.rating} reviewCount={nft.reviewCount} />
            </div>
            <hr className="mt-4 border-border" />
          </div>

          <section>
            <h2 className="text-body-md font-bold text-foreground">Sobre este NFT:</h2>
            <p className="mt-3 text-body leading-6 text-text-secondary">
              {nft.description}
            </p>
          </section>

          <BuyPanel nft={nft} />

          <dl className="flex flex-col gap-3 text-body-md text-brand-secondary">
            <div className="flex gap-2">
              <dt className="shrink-0">ID do token:</dt>
              <dd className="truncate">#{nft.id.replace(/\D/g, '')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0">Coleção:</dt>
              <dd>{COLLECTION_LABELS[nft.collection]}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0">Rede:</dt>
              <dd>{NETWORK_LABELS[nft.network]}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0">Atributos:</dt>
              <dd>{nft.attributes.map((item) => item.value).join(', ')}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="shrink-0">Criador:</dt>
              <dd>
                {nft.creator.name} ({nft.creator.handle})
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <RelatedProducts nft={nft} />
    </div>
  )
}

/**
 * Related items, drawn from the same collection. The current NFT is filtered
 * out client-side so the row never shows the item the user is already reading.
 */
function RelatedProducts({ nft }: { nft: NftDetail }) {
  const params = { collection: nft.collection, sort: 'trending', page: 1, pageSize: 4 }

  const { data, isPending } = useQuery({
    queryKey: queryKeys.nfts.list(params),
    queryFn: ({ signal }) => fetchNfts(params, signal),
  })

  const related: NftSummary[] = (data?.data ?? [])
    .filter((item) => item.id !== nft.id)
    .slice(0, 3)

  return (
    <section aria-labelledby="related-heading">
      <h2 id="related-heading" className="text-heading font-bold text-foreground">
        Você também pode gostar
      </h2>

      {isPending ? (
        <SkeletonGroup label="Carregando produtos relacionados" className="mt-6">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <li key={index}>
                <NftCardSkeleton />
              </li>
            ))}
          </ul>
        </SkeletonGroup>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-3">
          {related.map((item) => (
            <li key={item.id}>
              <NftCard nft={item} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function NftDetailPending() {
  return (
    <SkeletonGroup
      label="Carregando detalhes do NFT"
      className="mx-auto w-full max-w-shell px-5 py-8"
    >
      <SkeletonBlock className="h-4 w-48" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[573px_minmax(0,1fr)]">
        <div className="flex flex-col-reverse gap-4 sm:flex-row sm:gap-7">
          <div className="flex gap-4 sm:flex-col">
            {Array.from({ length: 3 }, (_, index) => (
              <SkeletonBlock key={index} className="size-[100px]" rounded="lg" />
            ))}
          </div>
          <SkeletonBlock className="aspect-square flex-1" rounded="lg" />
        </div>
        <div className="flex flex-col gap-5">
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="h-6 w-1/3" />
          <SkeletonText lines={4} />
          <SkeletonBlock className="h-10 w-full max-w-xs" />
        </div>
      </div>
    </SkeletonGroup>
  )
}
