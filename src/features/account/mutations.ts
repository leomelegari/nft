import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  PasswordChangeInput,
  ProfileInput,
  User,
  WalletInput,
} from '@/entities/auth'
import { queryKeys } from '@/shared/api/query-keys'
import { useOwnerKey } from '@/features/auth/queries'
import {
  changePassword,
  createWallet,
  deleteWallet,
  removeAvatar,
  updateAvatar,
  updateProfile,
  updateWallet,
} from '@/features/account/api'

/**
 * Account mutations.
 *
 * Profile changes write the fresh user straight into the session cache rather
 * than invalidating it: the response *is* the new user, so a refetch would only
 * ask the server to repeat itself while the header briefly showed stale data.
 */
function usePublishUser() {
  const queryClient = useQueryClient()

  return (user: User) => {
    queryClient.setQueryData(queryKeys.session(), (current: unknown) =>
      current && typeof current === 'object'
        ? { ...(current as Record<string, unknown>), user }
        : current,
    )
    queryClient.setQueryData(queryKeys.profile(user.id), user)
  }
}

export function useUpdateProfile() {
  const publish = usePublishUser()

  return useMutation({
    mutationFn: (input: ProfileInput) => updateProfile(input),
    onSuccess: publish,
  })
}

export function useUpdateAvatar() {
  const publish = usePublishUser()

  return useMutation({
    mutationFn: (avatar: string) => updateAvatar(avatar),
    onSuccess: publish,
  })
}

export function useRemoveAvatar() {
  const publish = usePublishUser()

  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: publish,
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (input: PasswordChangeInput) => changePassword(input),
  })
}

function useInvalidateWallets() {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()

  return () => queryClient.invalidateQueries({ queryKey: queryKeys.wallets(ownerKey) })
}

export function useCreateWallet() {
  const invalidate = useInvalidateWallets()

  return useMutation({
    mutationFn: (input: WalletInput) => createWallet(input),
    onSuccess: invalidate,
  })
}

export function useUpdateWallet() {
  const invalidate = useInvalidateWallets()

  return useMutation({
    mutationFn: ({ walletId, input }: { walletId: string; input: WalletInput }) =>
      updateWallet(walletId, input),
    onSuccess: invalidate,
  })
}

export function useDeleteWallet() {
  const invalidate = useInvalidateWallets()

  return useMutation({
    mutationFn: (walletId: string) => deleteWallet(walletId),
    onSuccess: invalidate,
  })
}
