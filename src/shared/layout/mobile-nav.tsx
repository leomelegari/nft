import { Link } from '@tanstack/react-router'
import { NAV_ITEMS } from '@/shared/layout/nav-items'
import { Wordmark } from '@/shared/layout/wordmark'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog'

/**
 * Mobile navigation drawer.
 *
 * Built on the shadcn dialog so focus is trapped while open and restored to the
 * trigger on close, and Escape dismisses — all required by section 8.
 */
export function MobileNav({
  open,
  onOpenChange,
  returnFocusTo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * The drawer is opened from a button in the header rather than a
   * `DialogTrigger`, so Radix cannot infer where focus should go on close.
   * Restoring it explicitly keeps keyboard users where they left off.
   */
  returnFocusTo: React.RefObject<HTMLButtonElement | null>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          returnFocusTo.current?.focus()
        }}
        className="top-0 left-0 h-dvh max-w-none translate-x-0 translate-y-0 rounded-none border-0 border-r border-border-soft bg-card p-6 data-[state=open]:slide-in-from-left-4 sm:max-w-sm"
      >
        <DialogHeader className="text-left">
          <DialogTitle asChild>
            <Wordmark className="text-body-lg" />
          </DialogTitle>
        </DialogHeader>

        <nav aria-label="Navegação principal" className="mt-6">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) =>
              item.available ? (
                <li key={item.label}>
                  <Link
                    to="/"
                    {...(item.hash ? { hash: item.hash } : {})}
                    onClick={() => onOpenChange(false)}
                    className="block rounded-md px-3 py-3 text-body-2xl font-bold text-foreground transition-colors hover:bg-secondary hover:text-text-accent"
                  >
                    {item.label}
                  </Link>
                </li>
              ) : (
                <li key={item.label}>
                  <span
                    aria-disabled="true"
                    className="block cursor-not-allowed px-3 py-3 text-body-2xl text-foreground/45"
                  >
                    {item.label}
                  </span>
                </li>
              ),
            )}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  )
}
