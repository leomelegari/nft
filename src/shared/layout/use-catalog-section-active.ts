import { useEffect, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'

const CATALOG_SECTION_ID = 'catalogo'

/**
 * Tracks whether the catalog section of the home route is the one currently
 * in view — a scrollspy, not a route check.
 *
 * "Início" and "Mercado" share a single URL: the home route renders the hero
 * and the catalog in one scrollable page, and only the "Mercado" nav link
 * itself changes the URL hash when clicked. The hero's "Explorar" button,
 * pagination, and the header's search icon all scroll there directly via
 * `scrollIntoView`, without touching the hash — so a pathname- or hash-only
 * check left "Início" highlighted no matter how the user actually got to the
 * catalog. Watching the section's own position in the viewport is the only
 * check that is correct regardless of how the user arrived.
 *
 * Evaluated with a plain `scroll` listener rather than an IntersectionObserver
 * trigger band. A band-crossing observer is the usual scrollspy technique, but
 * a narrow band can be skipped entirely by a single large, unanimated jump —
 * verified: pagination's `scrollIntoView` (default `behavior: 'auto'`, an
 * instant jump) and a single large wheel delta both moved the section clean
 * through a 45px centre band without the observer firing even once, since the
 * browser only evaluates intersection against frames it actually renders, and
 * an instant jump renders only the final position. Re-deriving the answer
 * from the section's current rest geometry on every scroll event — rather
 * than detecting a crossing — is correct regardless of jump size.
 *
 * Known limitation: TanStack Router's `<Link>` forces its own
 * `aria-current="page"` whenever *its own* pathname match succeeds,
 * independent of this hook — by default it ignores the hash, so during a
 * scroll-only visit (no click on "Mercado") the router's own match stays true
 * for "Início" the whole time. A fix was attempted by syncing the URL hash to
 * this hook's answer via `router.navigate`, but that raced with the
 * navigation already triggered by clicking "Mercado" itself — both tried to
 * set the hash within the same tick, and the scrollspy's write sometimes won,
 * undoing the click. That regression (clicking "Mercado" failing to visually
 * select it) is worse than the cosmetic duplicate `aria-current`, so the sync
 * was reverted. The visual active state below — which drives what a sighted
 * user actually sees — is independent of the router's own match and is
 * correct in every scenario tested (see the nav verification notes in
 * ARCHITECTURE.md).
 */
export function useCatalogSectionActive(): boolean {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const [active, setActive] = useState(false)

  useEffect(() => {
    if (pathname !== '/') return

    const section = document.getElementById(CATALOG_SECTION_ID)
    if (!section) return

    let frame = 0

    const check = () => {
      frame = 0
      // "Arrived" once the section's top edge has scrolled above the
      // viewport's vertical centre — a plain rest-state check, not a
      // threshold crossing, so it is correct no matter how the scroll got
      // there.
      setActive(section.getBoundingClientRect().top < window.innerHeight / 2)
    }

    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(check)
    }

    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [pathname])

  // Derived rather than reset via setState in the effect: leaving the home
  // route removes the listeners above, so a stale `true` from a previous
  // visit would otherwise linger in state until the next scroll event.
  return pathname === '/' && active
}
