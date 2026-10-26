import { useState } from 'react'
import { passwordChangeInputSchema } from '@/entities/auth'
import { useZodForm } from '@/shared/lib/use-zod-form'
import { useChangePassword } from '@/features/account/mutations'
import { Button } from '@/shared/ui/button'
import { FormError, FormField } from '@/shared/ui/form-field'
import { PasswordInput } from '@/shared/ui/password-input'

const EMPTY = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirmation: '',
}

/**
 * "Alterar senha".
 *
 * The Figma puts a single "Salvar" at the foot of the screen, below both the
 * profile fields and this block. They are two different operations against two
 * different endpoints, and one button would have to answer "the profile saved
 * but the current password was wrong" — a state with no good message. Each
 * block therefore submits on its own, and changing a password stays a
 * deliberate act rather than a side effect of editing a bio.
 */
export function PasswordForm() {
  const [values, setValues] = useState(EMPTY)
  const [changed, setChanged] = useState(false)

  const form = useZodForm(passwordChangeInputSchema)
  const change = useChangePassword()

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    form.clearField(key)
    setChanged(false)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = form.validate(values)
    if (!parsed) return

    change.mutate(parsed, {
      onSuccess: () => {
        // Never leave a password sitting in a mounted input after it was used.
        setValues(EMPTY)
        setChanged(true)
      },
      onError: (error) =>
        form.applyError(error, 'Não foi possível alterar a senha. Tente novamente.'),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <h2 className="text-body-xl font-medium text-foreground">Alterar senha</h2>

      <FormError message={form.formError} />

      <div className="flex max-w-[417px] flex-col gap-5">
        <FormField
          label="Senha atual"
          required
          error={form.fieldErrors.currentPassword}
        >
          {(props) => (
            <PasswordInput
              {...props}
              required
              name="currentPassword"
              autoComplete="current-password"
              value={values.currentPassword}
              onChange={(event) => set('currentPassword', event.target.value)}
            />
          )}
        </FormField>

        <FormField
          label="Nova senha"
          required
          error={form.fieldErrors.newPassword}
          hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
        >
          {(props) => (
            <PasswordInput
              {...props}
              required
              name="newPassword"
              autoComplete="new-password"
              value={values.newPassword}
              onChange={(event) => set('newPassword', event.target.value)}
            />
          )}
        </FormField>

        <FormField
          label="Confirmar nova senha"
          required
          error={form.fieldErrors.newPasswordConfirmation}
        >
          {(props) => (
            <PasswordInput
              {...props}
              required
              name="newPasswordConfirmation"
              autoComplete="new-password"
              value={values.newPasswordConfirmation}
              onChange={(event) => set('newPasswordConfirmation', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={change.isPending}
          className="h-10 w-[131px] rounded-[3px] font-bold"
        >
          {change.isPending ? 'Salvando…' : 'Salvar'}
        </Button>

        <span role="status" aria-live="polite" className="text-body-md text-success">
          {changed && 'Senha alterada'}
        </span>
      </div>
    </form>
  )
}
