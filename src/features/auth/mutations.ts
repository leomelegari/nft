import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { LoginInput, RegisterInput } from '@/entities/auth'
import { clearSessionToken, setSessionToken } from '@/shared/api'
import { queryKeys } from '@/shared/api/query-keys'
import { login, logout, register, type AuthResult } from '@/features/auth/api'
import { mergeGuestCart } from '@/features/cart/api'
import { clearGuestId } from '@/features/cart/guest-id'

/**
 * Completes a successful authentication.
 *
 * The visitor's cart is merged before the session cache is published, so the
 * first render as a signed-in user already shows the merged cart rather than
 * briefly showing an empty one.
 */
async function establishSession(
  queryClient: ReturnType<typeof useQueryClient>,
  result: AuthResult,
) {
  setSessionToken(result.token)

  try {
    await mergeGuestCart()
  } catch {
    // A failed merge must not block sign-in; the user is authenticated either
    // way and their server-side cart is intact.
  }

  queryClient.setQueryData(queryKeys.session(), result.session)
  await queryClient.invalidateQueries({
    queryKey: queryKeys.owner(result.session.user.id),
  })
}

export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: (result) => establishSession(queryClient, result),
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RegisterInput) => register(input),
    onSuccess: (result) => establishSession(queryClient, result),
  })
}

/**
 * Sign out.
 *
 * Every private cache entry is namespaced under `['owner', ownerKey]`, so
 * removing that prefix drops all of it at once — no list of things to clear
 * that can fall out of date. A fresh guest id is issued so the next visitor
 * session starts with an empty cart rather than inheriting the previous one.
 */
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearSessionToken()
      clearGuestId()
      queryClient.removeQueries({ queryKey: ['owner'] })
      queryClient.setQueryData(queryKeys.session(), null)
      await queryClient.invalidateQueries({ queryKey: queryKeys.session() })
    },
  })
}
