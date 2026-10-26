import {
  nftDetailSchema,
  nftFacetsSchema,
  nftListResponseSchema,
  type NftDetail,
  type NftFacets,
  type NftListResponse,
} from '@/entities/nft'
import { request } from '@/shared/api'

export function fetchNfts(
  params: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<NftListResponse> {
  return request(nftListResponseSchema, {
    method: 'GET',
    url: '/nfts',
    params,
    ...(signal ? { signal } : {}),
  })
}

export function fetchFacets(
  params: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<NftFacets> {
  return request(nftFacetsSchema, {
    method: 'GET',
    url: '/nfts/facets',
    params,
    ...(signal ? { signal } : {}),
  })
}

export function fetchNftDetail(slug: string, signal?: AbortSignal): Promise<NftDetail> {
  return request(nftDetailSchema, {
    method: 'GET',
    url: `/nfts/${encodeURIComponent(slug)}`,
    ...(signal ? { signal } : {}),
  })
}
