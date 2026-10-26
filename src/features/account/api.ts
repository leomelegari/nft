import { z } from 'zod'
import { walletSchema, type Wallet, type WalletInput } from '@/entities/auth'
import { request } from '@/shared/api'

const walletListSchema = z.object({
  data: z.array(walletSchema),
  meta: z.object({
    page: z.number(),
    pageSize: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export async function fetchWallets(signal?: AbortSignal): Promise<Wallet[]> {
  const response = await request(walletListSchema, {
    method: 'GET',
    url: '/wallets',
    ...(signal ? { signal } : {}),
  })
  return response.data
}

export function createWallet(input: WalletInput): Promise<Wallet> {
  return request(walletSchema, { method: 'POST', url: '/wallets', data: input })
}

export function updateWallet(walletId: string, input: WalletInput): Promise<Wallet> {
  return request(walletSchema, {
    method: 'PATCH',
    url: `/wallets/${encodeURIComponent(walletId)}`,
    data: input,
  })
}
