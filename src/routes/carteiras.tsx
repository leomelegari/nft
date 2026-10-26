import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/features/auth/guard'
import { useWalletsQuery } from '@/features/account/queries'
import { AccountLayout } from '@/features/account/account-layout'
import { WalletSlot } from '@/features/account/wallet-slot'
import { isApiError } from '@/shared/api'
import { Button } from '@/shared/ui/button'
import { SkeletonBlock, SkeletonGroup } from '@/shared/ui/skeleton-primitives'

export const Route = createFileRoute('/carteiras')({
  beforeLoad: ({ context, location }) => requireAuth(context.queryClient, location.href),
  component: WalletsPage,
})

function WalletsPage() {
  const wallets = useWalletsQuery()

  if (wallets.isPending) {
    return (
      <AccountLayout title="Carteiras">
        <SkeletonGroup label="Carregando carteiras">
          <div className="flex flex-col gap-6">
            <SkeletonBlock className="h-5 w-48" />
            <SkeletonBlock className="h-10 w-full max-w-[417px]" />
            <SkeletonBlock className="h-10 w-full max-w-[417px]" />
          </div>
        </SkeletonGroup>
      </AccountLayout>
    )
  }

  if (wallets.error) {
    return (
      <AccountLayout title="Carteiras">
        <div
          role="alert"
          className="flex flex-col items-start gap-4 rounded-xl border border-border-soft bg-card p-8"
        >
          <h2 className="text-body-xl font-bold text-foreground">
            Não foi possível carregar suas carteiras
          </h2>
          <p className="text-body text-text-secondary">
            {isApiError(wallets.error) ? wallets.error.message : 'Tente novamente.'}
          </p>
          <Button onClick={() => void wallets.refetch()}>Tentar novamente</Button>
        </div>
      </AccountLayout>
    )
  }

  const list = wallets.data ?? []

  return (
    <AccountLayout title="Carteiras">
      <WalletSlot
        kind="primary"
        title="Carteira principal"
        description="Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados."
        emptyMessage="Você ainda não adicionou uma carteira principal."
        wallet={list.find((wallet) => wallet.kind === 'primary')}
      />

      <hr className="border-border-soft" />

      <WalletSlot
        kind="secondary"
        title="Carteira secundária"
        emptyMessage="Você ainda não adicionou uma carteira secundária."
        wallet={list.find((wallet) => wallet.kind === 'secondary')}
      />
    </AccountLayout>
  )
}
