import { http, HttpResponse, delay } from 'msw'
import {
  AVAILABILITY_FILTERS,
  COLLECTION_SLUGS,
  NETWORKS,
  type AvailabilityFilter,
  type CollectionSlug,
  type Network,
  type NftSort,
} from '@/entities/nft'
import { compareEth, toEth } from '@/shared/money'
import { getDb } from '@/mocks/db/store'
import { getScenario } from '@/mocks/scenarios'
import type { MockNft } from '@/mocks/db/types'
import { fail, handler } from '@/mocks/handlers/support'

const DEFAULT_PAGE_SIZE = 9
const MAX_PAGE_SIZE = 48

function parseList<T extends string>(raw: string | null, allowed: readonly T[]): T[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value): value is T => (allowed as readonly string[]).includes(value))
}

function matchesQuery(nft: MockNft, query: string): boolean {
  if (!query) return true
  const needle = query.toLowerCase()
  return (
    nft.title.toLowerCase().includes(needle) ||
    nft.creator.name.toLowerCase().includes(needle) ||
    nft.description.toLowerCase().includes(needle)
  )
}

interface CatalogFilters {
  query: string
  collections: CollectionSlug[]
  networks: Network[]
  minPrice: string | null
  maxPrice: string | null
  tab: string
  availability: AvailabilityFilter
}

function readFilters(url: URL): CatalogFilters {
  return {
    query: (url.searchParams.get('q') ?? '').trim(),
    collections: parseList(url.searchParams.get('collection'), COLLECTION_SLUGS),
    networks: parseList(url.searchParams.get('network'), NETWORKS),
    minPrice: url.searchParams.get('minPrice'),
    maxPrice: url.searchParams.get('maxPrice'),
    tab: url.searchParams.get('tab') ?? 'all',
    availability: parseAvailability(url.searchParams.get('availability')),
  }
}

function parseAvailability(raw: string | null): AvailabilityFilter {
  return (AVAILABILITY_FILTERS as readonly string[]).includes(raw ?? '')
    ? (raw as AvailabilityFilter)
    : 'all'
}

const NEW_RELEASE_CUTOFF = Date.UTC(2026, 7, 1)
const TRENDING_THRESHOLD = 70

function applyFilters(nfts: MockNft[], filters: CatalogFilters): MockNft[] {
  return nfts.filter((nft) => {
    if (!matchesQuery(nft, filters.query)) return false
    if (filters.collections.length && !filters.collections.includes(nft.collection))
      return false
    if (filters.networks.length && !filters.networks.includes(nft.network)) return false
    if (filters.minPrice && compareEth(nft.priceEth, toEth(filters.minPrice)) < 0)
      return false
    if (filters.maxPrice && compareEth(nft.priceEth, toEth(filters.maxPrice)) > 0)
      return false
    if (filters.tab === 'new' && new Date(nft.listedAt).getTime() < NEW_RELEASE_CUTOFF)
      return false
    if (filters.tab === 'trending' && nft.trendScore < TRENDING_THRESHOLD) return false
    if (filters.availability === 'available' && nft.available === 0) return false
    return true
  })
}

const SORTERS: Record<NftSort, (a: MockNft, b: MockNft) => number> = {
  recent: (a, b) => new Date(b.listedAt).getTime() - new Date(a.listedAt).getTime(),
  'price-asc': (a, b) => compareEth(a.priceEth, b.priceEth),
  'price-desc': (a, b) => compareEth(b.priceEth, a.priceEth),
  trending: (a, b) => b.trendScore - a.trendScore,
}

function toSummary(nft: MockNft) {
  return {
    id: nft.id,
    slug: nft.slug,
    title: nft.title,
    priceEth: nft.priceEth,
    image: nft.image,
    imageAlt: nft.imageAlt,
    collection: nft.collection,
    network: nft.network,
    available: nft.available,
    version: nft.version,
  }
}

export const nftHandlers = [
  http.get(
    '/api/nfts',
    handler(async ({ request }) => {
      const url = new URL(request.url)
      const filters = readFilters(url)
      const scenario = getScenario()

      const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
      const pageSize = Math.min(
        MAX_PAGE_SIZE,
        Math.max(
          1,
          Number(url.searchParams.get('pageSize') ?? DEFAULT_PAGE_SIZE) ||
            DEFAULT_PAGE_SIZE,
        ),
      )

      const sortParam = url.searchParams.get('sort') ?? 'recent'
      const sorter = SORTERS[sortParam as NftSort] ?? SORTERS.recent

      /**
       * Out-of-order simulation: earlier pages are delayed longer than later
       * ones, so a request issued first resolves last. A client that renders
       * whatever arrives last will visibly show the wrong page.
       */
      if (scenario.network.outOfOrder) {
        await delay(Math.max(0, 1600 - page * 400))
      }

      const matched = scenario.behavior.emptyCatalog
        ? []
        : applyFilters(getDb().nfts, filters).sort(sorter)

      const total = matched.length
      const totalPages = Math.ceil(total / pageSize)
      const start = (page - 1) * pageSize

      return HttpResponse.json({
        data: matched.slice(start, start + pageSize).map(toSummary),
        meta: { page, pageSize, total, totalPages },
      })
    }),
  ),

  /**
   * Facet counts are computed over the text-query result set but ignore the
   * collection and network selections themselves, so selecting one collection
   * does not zero out every other row in the sidebar.
   */
  http.get(
    '/api/nfts/facets',
    handler(({ request }) => {
      const url = new URL(request.url)
      const filters = readFilters(url)
      const base = applyFilters(getDb().nfts, {
        ...filters,
        collections: [],
        networks: [],
        minPrice: null,
        maxPrice: null,
      })

      const collections = Object.fromEntries(
        COLLECTION_SLUGS.map((slug) => [
          slug,
          base.filter((nft) => nft.collection === slug).length,
        ]),
      )
      const networks = Object.fromEntries(
        NETWORKS.map((network) => [
          network,
          base.filter((nft) => nft.network === network).length,
        ]),
      )

      const prices = base.map((nft) => nft.priceEth).sort(compareEth)

      return HttpResponse.json({
        collections,
        networks,
        priceRange: {
          min: prices[0] ?? toEth('0'),
          max: prices[prices.length - 1] ?? toEth('0'),
        },
      })
    }),
  ),

  http.get<{ slug: string }>(
    '/api/nfts/:slug',
    handler(({ params }) => {
      const nft = getDb().nfts.find((item) => item.slug === params.slug)
      if (!nft) {
        fail('NOT_FOUND', 'Este NFT não existe ou foi removido do marketplace.')
      }
      return HttpResponse.json(nft)
    }),
  ),
]
