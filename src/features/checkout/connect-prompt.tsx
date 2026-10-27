import type { Wallet } from '@/entities/auth'
import { WALLET_PROVIDER_LABELS } from '@/entities/auth'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

/**
 * Stands in for a wallet extension's approval prompt.
 *
 * Refusal is an explicit user action rather than a random outcome, so the
 * "conexão recusada" path is reproducible by hand and by a test.
 */
export function ConnectPrompt({
  wallet,
  open,
  onApprove,
  onRefuse,
}: {
  wallet: Wallet | null
  open: boolean
  onApprove: () => void
  onRefuse: () => void
}) {
  return (
    <Dialog open={open && wallet !== null} onOpenChange={(next) => !next && onRefuse()}>
      <DialogContent className="border-border-soft bg-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Conectar {wallet ? WALLET_PROVIDER_LABELS[wallet.provider] : 'carteira'}
          </DialogTitle>
          <DialogDescription className="text-text-secondary">
            Simulação da aprovação da carteira. Nenhuma extensão real é acionada e nenhuma
            transação é assinada.
          </DialogDescription>
        </DialogHeader>

        {wallet && (
          <dl className="flex min-w-0 flex-col gap-3 text-body-md">
            <div className="flex min-w-0 justify-between gap-3">
              <dt className="shrink-0 text-text-secondary">Carteira</dt>
              <dd className="min-w-0 truncate text-foreground">{wallet.label}</dd>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <dt className="text-text-secondary">Endereço</dt>
              {/*
                Shown in full and allowed to wrap, not truncated: this is the
                address the user is being asked to approve, and hiding half of
                it defeats the point of asking.
              */}
              <dd className="font-mono text-caption-lg break-all text-foreground">
                {wallet.address}
              </dd>
            </div>
          </dl>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="outline" onClick={onRefuse}>
            Recusar
          </Button>
          <Button onClick={onApprove}>Aprovar conexão</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
