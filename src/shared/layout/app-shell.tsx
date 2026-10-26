import { useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Footer } from '@/shared/layout/footer'
import { Header } from '@/shared/layout/header'
import { MobileNav } from '@/shared/layout/mobile-nav'
import { useCartItemCount } from '@/features/cart/queries'

/**
 * Page chrome shared by every route: header, mobile drawer and footer, with the
 * main landmark the skip link targets.
 *
 * The cart badge reads the real cart query rather than a prop, so it stays
 * correct after any mutation or socket update without each page having to
 * thread the count down.
 */
export function AppShell({
  children,
  withHeaderDivider = true,
}: {
  children: React.ReactNode
  withHeaderDivider?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const cartCount = useCartItemCount()
  const navigate = useNavigate()

  return (
    <>
      <Header
        cartCount={cartCount}
        menuButtonRef={menuButtonRef}
        withDivider={withHeaderDivider}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenSearch={() => {
          // Search belongs to the market screen, which owns the filter bar.
          // The icon used to call `scrollIntoView('#catalogo')`, which was a
          // no-op on every route other than the home page.
          void navigate({ to: '/mercado' })
        }}
      />

      <MobileNav
        open={menuOpen}
        onOpenChange={setMenuOpen}
        returnFocusTo={menuButtonRef}
      />

      <main id="main-content" className="flex w-full flex-1 flex-col">
        {children}
      </main>

      <Footer />
    </>
  )
}
