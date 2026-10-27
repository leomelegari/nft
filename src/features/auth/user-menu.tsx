import { useRef, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import LogoutIcon from '@/assets/icons/logout.svg?react'
import { useCurrentUser } from '@/features/auth/queries'
import { useLogout } from '@/features/auth/mutations'
import { Button } from '@/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'

/**
 * Header account control: the design's "Entrar" button for a visitor, and the
 * account name with a sign-out action once signed in.
 */
export function UserMenu({ currentHref }: { currentHref: string }) {
  const user = useCurrentUser()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const logout = useLogout()

  if (!user) {
    return (
      <Link
        to="/entrar"
        search={currentHref === '/' ? {} : { redirect: currentHref }}
        className="inline-flex h-[35px] items-center justify-center gap-1 rounded-md bg-primary px-4 text-body-lg font-medium text-primary-foreground transition-colors hover:bg-text-accent"
      >
        <LogoutIcon className="size-5" aria-hidden="true" />
        Entrar
      </Link>
    )
  }

  const firstName = user.name.split(' ')[0] ?? user.name

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-[35px] max-w-[11rem] items-center gap-2 rounded-md border border-border-soft px-3 text-body text-foreground transition-colors hover:border-primary focus-visible:outline-ring"
      >
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-caption font-bold text-primary-foreground">
          {firstName.charAt(0).toUpperCase()}
        </span>
        <span className="truncate">{firstName}</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            triggerRef.current?.focus()
          }}
          className="border-border-soft bg-card sm:max-w-sm"
        >
          <DialogHeader>
            <DialogTitle>{user.name}</DialogTitle>
            <DialogDescription className="text-text-secondary">
              {user.email}
            </DialogDescription>
          </DialogHeader>

          <nav aria-label="Conta" className="flex flex-col gap-2">
            <Link
              to="/perfil"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-body text-foreground transition-colors hover:bg-secondary"
            >
              Perfil do colecionador
            </Link>
            <Link
              to="/lista-de-interesse"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-body text-foreground transition-colors hover:bg-secondary"
            >
              Lista de interesse
            </Link>
            <Link
              to="/carteiras"
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-2 text-body text-foreground transition-colors hover:bg-secondary"
            >
              Carteiras
            </Link>
          </nav>

          <Button
            variant="outline"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSettled: () => {
                  setOpen(false)
                  void navigate({ to: '/', replace: true })
                },
              })
            }
          >
            {logout.isPending ? 'Saindo…' : 'Sair da conta'}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  )
}
