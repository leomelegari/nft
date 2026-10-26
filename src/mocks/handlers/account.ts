import { http, HttpResponse } from 'msw'
import { z } from 'zod'
import {
  passwordChangeInputSchema,
  profileInputSchema,
  walletInputSchema,
} from '@/entities/auth'
import { getDb, mutateDb, nextId } from '@/mocks/db/store'
import { digestPassword } from '@/mocks/db/seed'
import { toPublicUser } from '@/mocks/handlers/session'
import { fail, handler, parseBody, requireAuth } from '@/mocks/handlers/support'

const avatarInputSchema = z.object({
  /** Data URL produced by the client after reading the selected file. */
  avatar: z
    .string()
    .min(1, 'Selecione uma imagem')
    .refine((value) => value.startsWith('data:image/'), {
      message: 'Envie um arquivo de imagem válido',
    }),
})

export const accountHandlers = [
  http.get(
    '/api/profile',
    handler(({ request }) => HttpResponse.json(toPublicUser(requireAuth(request).user))),
  ),

  http.patch(
    '/api/profile',
    handler(async ({ request }) => {
      const { user } = requireAuth(request)
      const input = await parseBody(request, profileInputSchema)
      const email = input.email.trim().toLowerCase()

      const taken = getDb().users.some(
        (item) => item.id !== user.id && item.email.toLowerCase() === email,
      )
      if (taken) {
        fail('CONFLICT', 'Este e-mail já pertence a outra conta.', {
          fields: { email: 'E-mail já cadastrado' },
        })
      }

      const updated = mutateDb((draft) => {
        const target = draft.users.find((item) => item.id === user.id)
        if (!target) return null
        target.name = input.name.trim()
        target.email = email
        target.bio = input.bio
        target.location = input.location
        return target
      })

      if (!updated) fail('NOT_FOUND', 'Conta não encontrada.')
      return HttpResponse.json(toPublicUser(updated))
    }),
  ),

  http.put(
    '/api/profile/avatar',
    handler(async ({ request }) => {
      const { user } = requireAuth(request)
      const input = await parseBody(request, avatarInputSchema)

      const updated = mutateDb((draft) => {
        const target = draft.users.find((item) => item.id === user.id)
        if (target) target.avatar = input.avatar
        return target
      })

      if (!updated) fail('NOT_FOUND', 'Conta não encontrada.')
      return HttpResponse.json(toPublicUser(updated))
    }),
  ),

  http.post(
    '/api/profile/password',
    handler(async ({ request }) => {
      const { user } = requireAuth(request)
      const input = await parseBody(request, passwordChangeInputSchema)

      if (user.passwordDigest !== digestPassword(input.currentPassword)) {
        fail('VALIDATION_ERROR', 'A senha atual está incorreta.', {
          fields: { currentPassword: 'Senha atual incorreta' },
        })
      }

      mutateDb((draft) => {
        const target = draft.users.find((item) => item.id === user.id)
        if (target) target.passwordDigest = digestPassword(input.newPassword)
      })

      return new HttpResponse(null, { status: 204 })
    }),
  ),

  http.get(
    '/api/wallets',
    handler(({ request }) => {
      const { user } = requireAuth(request)
      return HttpResponse.json({
        data: user.wallets,
        meta: {
          page: 1,
          pageSize: user.wallets.length || 1,
          total: user.wallets.length,
          totalPages: 1,
        },
      })
    }),
  ),

  http.post(
    '/api/wallets',
    handler(async ({ request }) => {
      const { user } = requireAuth(request)
      const input = await parseBody(request, walletInputSchema)

      // One wallet per kind: the design exposes exactly a primary and a
      // secondary slot, so a second "primary" would have nowhere to render.
      if (user.wallets.some((wallet) => wallet.kind === input.kind)) {
        fail('CONFLICT', 'Já existe uma carteira cadastrada neste slot.', {
          fields: { kind: 'Slot já utilizado' },
        })
      }

      if (user.wallets.some((wallet) => wallet.address === input.address)) {
        fail('CONFLICT', 'Este endereço já está cadastrado.', {
          fields: { address: 'Endereço já cadastrado' },
        })
      }

      const wallet = { id: nextId('wlt'), ...input }
      mutateDb((draft) => {
        draft.users.find((item) => item.id === user.id)?.wallets.push(wallet)
      })

      return HttpResponse.json(wallet, { status: 201 })
    }),
  ),

  http.patch<{ walletId: string }>(
    '/api/wallets/:walletId',
    handler(async ({ request, params }) => {
      const { user } = requireAuth(request)
      const input = await parseBody(request, walletInputSchema)

      if (!user.wallets.some((wallet) => wallet.id === params.walletId)) {
        fail('NOT_FOUND', 'Carteira não encontrada.')
      }

      const conflict = user.wallets.some(
        (wallet) => wallet.id !== params.walletId && wallet.address === input.address,
      )
      if (conflict) {
        fail('CONFLICT', 'Este endereço já está cadastrado.', {
          fields: { address: 'Endereço já cadastrado' },
        })
      }

      const updated = mutateDb((draft) => {
        const target = draft.users
          .find((item) => item.id === user.id)
          ?.wallets.find((wallet) => wallet.id === params.walletId)
        if (!target) return null
        Object.assign(target, input)
        return target
      })

      if (!updated) fail('NOT_FOUND', 'Carteira não encontrada.')
      return HttpResponse.json(updated)
    }),
  ),

  http.delete<{ walletId: string }>(
    '/api/wallets/:walletId',
    handler(({ request, params }) => {
      const { user } = requireAuth(request)

      const removed = mutateDb((draft) => {
        const target = draft.users.find((item) => item.id === user.id)
        if (!target) return false
        const before = target.wallets.length
        target.wallets = target.wallets.filter((wallet) => wallet.id !== params.walletId)
        return target.wallets.length !== before
      })

      if (!removed) fail('NOT_FOUND', 'Carteira não encontrada.')
      return new HttpResponse(null, { status: 204 })
    }),
  ),
]
