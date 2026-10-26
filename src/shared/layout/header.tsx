import { Link, useRouterState } from '@tanstack/react-router'
import CartIcon from '@/assets/icons/cart.svg?react'
import SearchIcon from '@/assets/icons/search.svg?react'
import { UserMenu } from '@/features/auth/user-menu'
import { Wordmark } from '@/shared/layout/wordmark'
import { NAV_ITEMS, isNavItemActive } from '@/shared/layout/nav-items'
import { cn } from '@/shared/lib/utils'

interface HeaderProps {
  cartCount: number
  menuButtonRef: React.RefObject<HTMLButtonElement | null>
  /** Rendered on the home, profile and wallet screens, per the Figma notes. */
  withDivider?: boolean
  onOpenSearch: () => void
  onOpenMenu: () => void
}

export function Header({
  cartCount,
  menuButtonRef,
  withDivider = true,
  onOpenSearch,
  onOpenMenu,
}: HeaderProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const href = useRouterState({ select: (state) => state.location.href })

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full bg-background',
        withDivider && 'border-b border-border-soft',
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-shell items-center justify-between gap-6 px-5 lg:h-[72px]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            ref={menuButtonRef}
            onClick={onOpenMenu}
            className="-ml-1 rounded-sm p-1 text-foreground hover:text-text-accent lg:hidden"
            aria-label="Abrir menu de navegação"
          >
            <MenuGlyph />
          </button>
          <Wordmark />
        </div>

        <nav aria-label="Navegação principal" className="hidden lg:block">
          <ul className="flex items-center gap-10">
            {NAV_ITEMS.map((item) => {
              const active = isNavItemActive(item, pathname)

              if (!item.available) {
                return (
                  <li key={item.label}>
                    {/*
                      Out-of-scope destination: announced as disabled instead of
                      being a link that goes nowhere.
                    */}
                    <span
                      aria-disabled="true"
                      title="Seção fora do escopo desta entrega"
                      className="cursor-not-allowed text-body-lg text-foreground/45"
                    >
                      {item.label}
                    </span>
                  </li>
                )
              }

              return (
                <li key={item.label} className="relative">
                  <Link
                    to="/"
                    {...(item.hash ? { hash: item.hash } : {})}
                    className={cn(
                      'block rounded-sm pb-1 text-body-lg transition-colors',
                      active
                        ? 'font-bold text-text-accent'
                        : 'text-foreground hover:text-text-accent',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                  {active && (
                    <span
                      aria-hidden="true"
                      className="absolute -bottom-[1px] left-0 h-[3px] w-full rounded-full bg-text-accent"
                    />
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-5 lg:gap-7">
          <button
            type="button"
            onClick={onOpenSearch}
            className="rounded-sm p-1 text-foreground transition-colors hover:text-text-accent"
            aria-label="Buscar NFTs"
          >
            <SearchIcon className="size-5" aria-hidden="true" />
          </button>

          <Link
            to="/"
            className="relative rounded-sm p-1 text-foreground transition-colors hover:text-text-accent"
          >
            <CartIcon className="size-6" aria-hidden="true" />
            {cartCount > 0 && (
              <span
                aria-hidden="true"
                className="absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-text-accent text-tiny font-medium text-ink"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
            <span className="sr-only">
              Carrinho
              {cartCount > 0
                ? `, ${cartCount} ${cartCount === 1 ? 'item' : 'itens'}`
                : ', vazio'}
            </span>
          </Link>

          <UserMenu currentHref={href} />
        </div>
      </div>
    </header>
  )
}

/** The mobile frames use a three-bar menu glyph that has no exported asset. */
function MenuGlyph() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      fill="none"
      aria-hidden="true"
      className="block"
    >
      <path
        d="M3 6h16M3 11h16M3 16h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}
