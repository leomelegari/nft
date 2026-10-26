import { nftListResponseSchema, type NftListResponse } from '@/entities/nft'
import { api, request } from '@/shared/api'

export function fetchFavorites(signal?: AbortSignal): Promise<NftListResponse> {
  return request(nftListResponseSchema, {
    method: 'GET',
    url: '/favorites',
    ...(signal ? { signal } : {}),
  })
}

export async function addFavorite(nftId: string): Promise<void> {
  await api.put(`/favorites/${encodeURIComponent(nftId)}`)
}

export async function removeFavorite(nftId: string): Promise<void> {
  await api.delete(`/favorites/${encodeURIComponent(nftId)}`)
}
