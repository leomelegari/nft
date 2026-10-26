import { Link, useNavigate } from '@tanstack/react-router'
import { LoginForm } from '@/features/auth/login-form'
import { RegisterForm } from '@/features/auth/register-form'
import { SocialButtons } from '@/features/auth/social-buttons'
import { Dialog, DialogContent, DialogTitle } from '@/shared/ui/dialog'
import { cn } from '@/shared/lib/utils'
import { SEED_CREDENTIALS_HINT } from '@/features/auth/demo-hint'

/**
 * Sign-in / sign-up modal.
 *
 * Both are routes (`/entrar`, `/cadastro`) rather than local state, so the
 * screens have real URLs that survive refresh and direct access — the brief
 * requires direct access to work on every screen.
 *
 * `redirect` carries where the user was heading, which is how an interrupted
 * checkout resumes after signing in.
 */
export function AuthDialog({
  mode,
  redirect,
}: {
  mode: 'login' | 'register'
  redirect: string | undefined
}) {
  const navigate = useNavigate()

  function finish() {
    void navigate({ to: redirect ?? '/', replace: true })
  }

  function dismiss() {
    void navigate({ to: '/', replace: true })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && dismiss()}>
      <DialogContent className="max-h-[92dvh] gap-0 overflow-y-auto border-border-soft bg-card p-0 sm:max-w-[500px]">
        <div className="flex flex-col items-center px-8 pt-12 sm:px-12">
          <DialogTitle asChild>
            <div className="flex items-center gap-2">
              <ModeLink to="/entrar" active={mode === 'login'} redirect={redirect}>
                Entrar
              </ModeLink>
              <span aria-hidden="true" className="h-5 w-px bg-text-coral" />
              <ModeLink to="/cadastro" active={mode === 'register'} redirect={redirect}>
                Criar conta
              </ModeLink>
            </div>
          </DialogTitle>

          <p className="mt-10 text-center text-caption-lg text-foreground">
            {mode === 'login'
              ? 'Entre para gerenciar sua carteira, coleção e perfil de criador.'
              : 'Crie sua conta para colecionar, favoritar e acompanhar seus pedidos.'}
          </p>
        </div>

        <div className="px-8 pt-6 sm:px-20">
          {mode === 'login' ? (
            <LoginForm onSuccess={finish} />
          ) : (
            <RegisterForm onSuccess={finish} />
          )}
        </div>

        <div className="px-8 pt-6 pb-10 sm:px-20">
          <SocialButtons />
          <SEED_CREDENTIALS_HINT />
        </div>

        {/* Decorative accent bar from the design. */}
        <div aria-hidden="true" className="h-2.5 w-full bg-primary" />
      </DialogContent>
    </Dialog>
  )
}

function ModeLink({
  to,
  active,
  redirect,
  children,
}: {
  to: '/entrar' | '/cadastro'
  active: boolean
  redirect: string | undefined
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      search={redirect ? { redirect } : {}}
      replace
      aria-current={active ? 'page' : undefined}
      className={cn(
        'rounded-sm text-[20px] font-medium transition-colors',
        active ? 'text-text-accent' : 'text-foreground hover:text-text-accent',
      )}
    >
      {children}
    </Link>
  )
}
