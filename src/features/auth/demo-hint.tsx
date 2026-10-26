import { SEED_CREDENTIALS } from '@/mocks/db/seed'
import { mocksEnabled } from '@/mocks/enable'

/**
 * Fictional credentials, surfaced in the UI so a reviewer can sign in without
 * reading the README first. Only rendered while the mock layer is active.
 */
export function SEED_CREDENTIALS_HINT() {
  if (!mocksEnabled()) return null

  return (
    <div className="mt-6 rounded-md border border-border-soft bg-secondary/60 p-3">
      <p className="text-caption font-bold text-text-secondary">
        Credenciais de demonstração
      </p>
      <ul className="mt-1.5 flex flex-col gap-1">
        {SEED_CREDENTIALS.map((credential) => (
          <li key={credential.email} className="text-caption text-text-secondary">
            <code>{credential.email}</code> · <code>{credential.password}</code>
          </li>
        ))}
      </ul>
    </div>
  )
}
