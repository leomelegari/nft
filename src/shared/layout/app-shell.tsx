import { useRef, useState } from 'react'
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

  return (
    <>
      <Header
        cartCount={cartCount}
        menuButtonRef={menuButtonRef}
        withDivider={withHeaderDivider}
        onOpenMenu={() => setMenuOpen(true)}
        onOpenSearch={() => {
          // Search lives in the catalog toolbar; the header icon scrolls to it
          // until the dedicated overlay lands with the catalog feature.
          document.getElementById('catalogo')?.scrollIntoView({ block: 'start' })
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
