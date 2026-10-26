import { Link } from '@tanstack/react-router'
import { WALLET_PROVIDER_LABELS, type Wallet } from '@/entities/auth'
import { NETWORK_LABELS } from '@/entities/nft'
import type { ConnectionStatus } from '@/features/checkout/wallet-connection'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock } from '@/shared/ui/skeleton-primitives'
import { cn } from '@/shared/lib/utils'

/**
 * Wallet and network selection.
 *
 * The Figma duplicates this: the left column has "Rede", "Endereço da carteira"
 * and "Tipo de carteira" selects, and the right panel has a wallet radio group.
 * Two controls for one value is a state-synchronisation bug waiting to happen,
 * so selection lives here, on the registered wallets, and the network follows
 * from the chosen wallet rather than being picked independently (a wallet that
 * does not operate on the selected network is rejected by the API anyway).
 */
export function WalletSelector({
  wallets,
  isLoading,
  selectedId,
  onSelect,
  connectionStatus,
  connectedWalletId,
  onConnect,
  onDisconnect,
}: {
  wallets: Wallet[]
  isLoading: boolean
  selectedId: string | null
  onSelect: (walletId: string) => void
  connectionStatus: ConnectionStatus
  connectedWalletId: string | null
  onConnect: () => void
  onDisconnect: () => void
}) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-[45px] w-full" />
        <SkeletonBlock className="h-[45px] w-full" />
      </div>
    )
  }

  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-md border border-border-soft bg-card p-5 text-center">
        <h3 className="text-body-xl font-bold text-foreground">Carteira e rede</h3>
        <p className="text-body text-text-secondary">
          Você ainda não cadastrou uma carteira. É necessário ter uma para finalizar a
          compra.
        </p>
        <Button asChild variant="outline">
          <Link to="/carteiras">Cadastrar carteira</Link>
        </Button>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-5">
      <h3 className="text-center text-body-xl font-bold text-foreground">
        Carteira e rede
      </h3>

      <fieldset className="flex flex-col gap-4">
        <legend className="sr-only">Selecione a carteira para pagamento</legend>

        {wallets.map((wallet) => {
          const selected = wallet.id === selectedId
          return (
            <label
              key={wallet.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded-[3px] border px-4 py-3 transition-colors',
                selected ? 'border-primary' : 'border-border hover:border-border-soft',
              )}
            >
              <input
                type="radio"
                name="wallet"
                value={wallet.id}
                checked={selected}
                onChange={() => onSelect(wallet.id)}
                className="size-4 shrink-0 accent-primary"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-body-md text-foreground">
                  {WALLET_PROVIDER_LABELS[wallet.provider]} · {wallet.label}
                </span>
                <span className="block truncate text-caption text-brand-secondary">
                  {NETWORK_LABELS[wallet.network]} · {wallet.address}
                </span>
              </span>
            </label>
          )
        })}
      </fieldset>

      <ConnectionRow
        status={connectionStatus}
        isConnectedWalletSelected={connectedWalletId === selectedId}
        onConnect={onConnect}
        onDisconnect={onDisconnect}
      />
    </section>
  )
}

function ConnectionRow({
  status,
  isConnectedWalletSelected,
  onConnect,
  onDisconnect,
}: {
  status: ConnectionStatus
  isConnectedWalletSelected: boolean
  onConnect: () => void
  onDisconnect: () => void
}) {
  if (status === 'connected' && isConnectedWalletSelected) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-body-md text-success">Carteira conectada</p>
        <button
          type="button"
          onClick={onDisconnect}
          className="rounded-sm text-body-md text-text-accent underline"
        >
          Desconectar
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {status === 'refused' && (
        <p role="alert" className="text-body-md text-danger">
          Conexão recusada na carteira. Conecte novamente para continuar.
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        onClick={onConnect}
        disabled={status === 'connecting'}
        className="h-[45px] w-full"
      >
        {status === 'connecting' ? 'Aguardando a carteira…' : 'Conectar carteira'}
      </Button>
    </div>
  )
}
