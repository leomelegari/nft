import { z } from 'zod'
import {
  userSchema,
  walletSchema,
  type PasswordChangeInput,
  type ProfileInput,
  type User,
  type Wallet,
  type WalletInput,
} from '@/entities/auth'
import { api, request } from '@/shared/api'

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

export function fetchProfile(signal?: AbortSignal): Promise<User> {
  return request(userSchema, {
    method: 'GET',
    url: '/profile',
    ...(signal ? { signal } : {}),
  })
}

export function updateProfile(input: ProfileInput): Promise<User> {
  return request(userSchema, { method: 'PATCH', url: '/profile', data: input })
}

/** The image is sent as a data URL; see `readFileAsDataUrl`. */
export function updateAvatar(avatar: string): Promise<User> {
  return request(userSchema, {
    method: 'PUT',
    url: '/profile/avatar',
    data: { avatar },
  })
}

export function removeAvatar(): Promise<User> {
  return request(userSchema, { method: 'DELETE', url: '/profile/avatar' })
}

export async function changePassword(input: PasswordChangeInput): Promise<void> {
  await api.post('/profile/password', input)
}

export async function deleteWallet(walletId: string): Promise<void> {
  await api.delete(`/wallets/${encodeURIComponent(walletId)}`)
}
