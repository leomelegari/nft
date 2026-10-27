import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import LogoutIcon from '@/assets/icons/logout.svg?react'
import { useLogout } from '@/features/auth/mutations'
import { ACCOUNT_NAV_ITEMS, type AccountNavItem } from '@/features/account/account-nav'
import { cn } from '@/shared/lib/utils'

/**
 * Account sidebar, shared by the profile and wallets screens.
 *
 * The Figma paints every row in the accent colour and marks the current one
 * with a 6px rule on the left edge. The rule is kept as the primary indicator
 * precisely because it is not a colour: the current row is also the only link
 * carrying `aria-current`, so the state is available without seeing it.
 */
export function AccountSidebar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const navigate = useNavigate()
  const logout = useLogout()

  return (
    <nav
      aria-label="Minha conta"
      className="flex shrink-0 flex-col rounded-xl bg-card py-2 lg:w-[310px]"
    >
      <h2 className="px-4 py-2.5 text-center text-body-xl font-bold text-foreground lg:text-left">
        Meu perfil
      </h2>

      <ul className="flex flex-col">
        {ACCOUNT_NAV_ITEMS.map((item) => (
          <li key={item.label}>
            <AccountNavRow item={item} pathname={pathname} />
          </li>
        ))}
      </ul>

      <hr className="my-1 border-border-soft" />

      <button
        type="button"
        disabled={logout.isPending}
        onClick={() =>
          logout.mutate(undefined, {
            onSettled: () => void navigate({ to: '/', replace: true }),
          })
        }
        className="flex h-10 items-center gap-3 px-6 text-left text-body-md font-bold text-text-accent transition-colors hover:bg-secondary focus-visible:outline-ring disabled:opacity-60"
      >
        <IconBox>
          <LogoutIcon aria-hidden="true" />
        </IconBox>
        {logout.isPending ? 'Saindo…' : 'Sair'}
      </button>
    </nav>
  )
}

function AccountNavRow({ item, pathname }: { item: AccountNavItem; pathname: string }) {
  const Icon = item.icon

  if (!item.available) {
    return (
      <span
        aria-disabled="true"
        title="Seção fora do escopo desta entrega"
        className="flex h-[45px] cursor-not-allowed items-center gap-3 border-l-6 border-transparent px-4 text-body-md text-foreground/45"
      >
        <IconBox>
          <Icon aria-hidden="true" />
        </IconBox>
        {item.label}
      </span>
    )
  }

  const active = pathname === item.to

  return (
    <Link
      to={item.to}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-[45px] items-center gap-3 border-l-6 px-4 text-body-md transition-colors',
        active
          ? 'border-primary bg-secondary/40 font-bold text-text-accent'
          : 'border-transparent text-text-accent hover:bg-secondary',
      )}
    >
      <IconBox>
        <Icon aria-hidden="true" />
      </IconBox>
      {item.label}
    </Link>
  )
}

/**
 * Fixed 20px slot for icons of differing intrinsic sizes.
 *
 * The exported icons keep their own width and height — they are not all
 * square, and forcing them to one box would stretch them — so the slot
 * centres whatever it is given and the rows still line up.
 */
function IconBox({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex size-5 shrink-0 items-center justify-center">{children}</span>
  )
}
