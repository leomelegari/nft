import { useState } from 'react'
import {
  WALLET_PROVIDERS,
  WALLET_PROVIDER_LABELS,
  walletInputSchema,
  type Wallet,
  type WalletKind,
} from '@/entities/auth'
import { NETWORKS, NETWORK_LABELS } from '@/entities/nft'
import { useZodForm } from '@/shared/lib/use-zod-form'
import { useCreateWallet, useUpdateWallet } from '@/features/account/mutations'
import { Button } from '@/shared/ui/button'
import { FormError, FormField, TextInput } from '@/shared/ui/form-field'

/**
 * Create or edit one wallet.
 *
 * The Figma's wallets form repeats five fields from the profile screen —
 * display name, profile name, e-mail, ENS name and referral code — which
 * belong to the account, not to a wallet, and have nowhere to be stored here.
 * What remains are the four the wallet actually has, laid out in the design's
 * two-column grid: alias, network, provider and address.
 *
 * The address is validated per network (EVM hex or Solana base58) by the same
 * schema the API uses, so a wrong-network address is rejected with a message
 * attached to the field rather than silently accepted.
 */
export function WalletForm({
  kind,
  wallet,
  onSaved,
}: {
  kind: WalletKind
  /** Absent when adding; present when editing the slot's existing wallet. */
  wallet?: Wallet
  /**
   * Reported upwards rather than confirmed here: creating a wallet gives the
   * slot a wallet id, which changes this form's key and remounts it, so any
   * success state held locally would be thrown away at the exact moment it
   * was earned.
   */
  onSaved?: () => void
}) {
  const [values, setValues] = useState({
    label: wallet?.label ?? '',
    network: wallet?.network ?? '',
    provider: wallet?.provider ?? '',
    address: wallet?.address ?? '',
  })

  const form = useZodForm(walletInputSchema)
  const create = useCreateWallet()
  const update = useUpdateWallet()

  const pending = create.isPending || update.isPending

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    form.clearField(key)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = form.validate({ ...values, kind })
    if (!parsed) return

    const onError = (error: unknown) =>
      form.applyError(error, 'Não foi possível salvar a carteira. Tente novamente.')

    const onSuccess = () => onSaved?.()

    if (wallet) {
      update.mutate({ walletId: wallet.id, input: parsed }, { onSuccess, onError })
      return
    }
    create.mutate(parsed, { onSuccess, onError })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormError message={form.formError} />

      <div className="grid gap-x-7 gap-y-6 lg:grid-cols-2">
        <FormField label="Apelido da carteira" required error={form.fieldErrors.label}>
          {(props) => (
            <TextInput
              {...props}
              required
              name="label"
              placeholder="Cofre principal"
              value={values.label}
              onChange={(event) => set('label', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="Rede" required error={form.fieldErrors.network}>
          {(props) => (
            <SelectInput
              {...props}
              required
              name="network"
              value={values.network}
              onChange={(event) => set('network', event.target.value)}
            >
              <option value="">Selecione uma rede</option>
              {NETWORKS.map((network) => (
                <option key={network} value={network}>
                  {NETWORK_LABELS[network]}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>

        <FormField label="Tipo de carteira" required error={form.fieldErrors.provider}>
          {(props) => (
            <SelectInput
              {...props}
              required
              name="provider"
              value={values.provider}
              onChange={(event) => set('provider', event.target.value)}
            >
              <option value="">Selecione uma carteira</option>
              {WALLET_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {WALLET_PROVIDER_LABELS[provider]}
                </option>
              ))}
            </SelectInput>
          )}
        </FormField>

        <FormField
          label="Endereço da carteira"
          required
          error={form.fieldErrors.address}
          hint={
            values.network === 'solana'
              ? 'Endereço base58 da Solana.'
              : 'Endereço 0x de 42 caracteres.'
          }
        >
          {(props) => (
            <TextInput
              {...props}
              required
              name="address"
              spellCheck={false}
              placeholder={
                values.network === 'solana'
                  ? 'Endereço base58 da carteira'
                  : 'Endereço 0x da carteira'
              }
              value={values.address}
              onChange={(event) => set('address', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <Button
        type="submit"
        disabled={pending}
        className="h-10 w-[150px] rounded-[3px] font-bold"
      >
        {pending ? 'Salvando…' : 'Salvar carteira'}
      </Button>
    </form>
  )
}

/** Matches `TextInput`'s box so a select and a text field line up. */
function SelectInput({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={
        className ??
        'h-10 w-full rounded-[5px] border border-border bg-card px-3.5 text-body text-foreground transition-colors focus-visible:outline-ring aria-invalid:border-danger'
      }
    >
      {children}
    </select>
  )
}
