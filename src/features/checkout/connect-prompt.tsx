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
          <dl className="flex flex-col gap-2 text-body-md">
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">Carteira</dt>
              <dd className="truncate text-foreground">{wallet.label}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-text-secondary">Endereço</dt>
              <dd className="truncate text-foreground">{wallet.address}</dd>
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
