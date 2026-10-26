import { z } from 'zod'
import {
  ethAmountSchema,
  isoDateSchema,
  paginatedSchema,
  versionSchema,
} from '@/entities/common'

/** Taxonomy is fixed by the Figma sidebar; the counts are derived from data. */
export const COLLECTION_SLUGS = [
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
] as const
export const collectionSlugSchema = z.enum(COLLECTION_SLUGS)
export type CollectionSlug = z.infer<typeof collectionSlugSchema>

export const COLLECTION_LABELS: Record<CollectionSlug, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

export const NETWORKS = ['ethereum', 'polygon', 'solana'] as const
export const networkSchema = z.enum(NETWORKS)
export type Network = z.infer<typeof networkSchema>

export const NETWORK_LABELS: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

/**
 * An NFT is sold in editions. Availability and price live on the edition, not
 * on the NFT, because the brief requires respecting "disponibilidade por NFT e
 * edição" and a per-edition purchase limit.
 */
export const nftEditionSchema = z.object({
  id: z.string(),
  label: z.string(),
  priceEth: ethAmountSchema,
  supply: z.number().int().positive(),
  available: z.number().int().nonnegative(),
  /** Per-order cap, independent of remaining supply. */
  maxPerOrder: z.number().int().positive(),
})
export type NftEdition = z.infer<typeof nftEditionSchema>

export const nftAttributeSchema = z.object({
  trait: z.string(),
  value: z.string(),
})

export const nftSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  /** Lowest edition price — what the catalog card shows. */
  priceEth: ethAmountSchema,
  image: z.string(),
  imageAlt: z.string(),
  collection: collectionSlugSchema,
  network: networkSchema,
  available: z.number().int().nonnegative(),
  version: versionSchema,
})
export type NftSummary = z.infer<typeof nftSummarySchema>

export const nftDetailSchema = nftSummarySchema.extend({
  description: z.string(),
  gallery: z.array(z.object({ src: z.string(), alt: z.string() })).min(1),
  creator: z.object({ name: z.string(), handle: z.string(), avatar: z.string() }),
  editions: z.array(nftEditionSchema),
  attributes: z.array(nftAttributeSchema),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().nonnegative(),
  listedAt: isoDateSchema,
  trendScore: z.number(),
})
export type NftDetail = z.infer<typeof nftDetailSchema>

export const nftListResponseSchema = paginatedSchema(nftSummarySchema)
export type NftListResponse = z.infer<typeof nftListResponseSchema>

/** Facet counts rendered next to each sidebar filter row. */
export const nftFacetsSchema = z.object({
  collections: z.record(collectionSlugSchema, z.number().int().nonnegative()),
  networks: z.record(networkSchema, z.number().int().nonnegative()),
  priceRange: z.object({ min: ethAmountSchema, max: ethAmountSchema }),
})
export type NftFacets = z.infer<typeof nftFacetsSchema>

export const NFT_SORTS = ['recent', 'price-asc', 'price-desc', 'trending'] as const
export const nftSortSchema = z.enum(NFT_SORTS)
export type NftSort = z.infer<typeof nftSortSchema>

export const NFT_SORT_LABELS: Record<NftSort, string> = {
  recent: 'Listados recentemente',
  'price-asc': 'Menor preço',
  'price-desc': 'Maior preço',
  trending: 'Em alta',
}

export const NFT_TABS = ['all', 'new', 'trending'] as const
export const nftTabSchema = z.enum(NFT_TABS)
export type NftTab = z.infer<typeof nftTabSchema>

export const NFT_TAB_LABELS: Record<NftTab, string> = {
  all: 'Todos os NFTs',
  new: 'Novos lançamentos',
  trending: 'Em alta',
}
