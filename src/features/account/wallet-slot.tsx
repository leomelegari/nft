import { useState } from 'react'
import type { Wallet, WalletKind } from '@/entities/auth'
import { isApiError } from '@/shared/api'
import { useDeleteWallet } from '@/features/account/mutations'
import { WalletForm } from '@/features/account/wallet-form'

/**
 * One wallet slot — primary or secondary — with its heading row.
 *
 * The account holds exactly one wallet per slot, which the API enforces, so
 * the heading's action is "Adicionar" while the slot is empty and "Remover"
 * once it is filled. The design's "Igual à carteira principal" radio is not
 * reproduced: two slots holding the same address is precisely what the API
 * rejects, and the checkout picks between them by address.
 */
export function WalletSlot({
  kind,
  title,
  description,
  emptyMessage,
  wallet,
}: {
  kind: WalletKind
  title: string
  description?: string
  emptyMessage: string
  wallet: Wallet | undefined
}) {
  const [adding, setAdding] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const remove = useDeleteWallet()

  const showForm = Boolean(wallet) || adding

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-body-xl font-bold text-foreground">{title}</h2>

        {wallet ? (
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => {
              setError(null)
              setSaved(false)
              remove.mutate(wallet.id, {
                onError: (mutationError) =>
                  setError(
                    isApiError(mutationError)
                      ? mutationError.message
                      : 'Não foi possível remover a carteira.',
                  ),
              })
            }}
            className="rounded-sm text-body-lg font-medium text-text-accent transition-colors hover:text-primary focus-visible:outline-ring disabled:opacity-60"
          >
            {remove.isPending ? 'Removendo…' : 'Remover'}
          </button>
        ) : (
          !adding && (
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="rounded-sm text-body-lg font-medium text-text-accent transition-colors hover:text-primary focus-visible:outline-ring"
            >
              Adicionar
            </button>
          )
        )}
      </div>

      {description && <p className="text-body-md text-text-secondary">{description}</p>}

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      {showForm ? (
        <div className="mt-3">
          {/*
            Keyed on the wallet so removing one and adding another starts from
            empty fields rather than the removed wallet's values.
          */}
          <WalletForm
            key={wallet?.id ?? 'new'}
            kind={kind}
            {...(wallet ? { wallet } : {})}
            onSaved={() => {
              setAdding(false)
              setSaved(true)
            }}
          />

          <p role="status" aria-live="polite" className="mt-3 text-body-md text-success">
            {saved && 'Carteira salva'}
          </p>
        </div>
      ) : (
        <p className="text-body-md text-text-secondary">{emptyMessage}</p>
      )}
    </section>
  )
}
