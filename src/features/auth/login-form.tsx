import { useState } from 'react'
import { loginInputSchema } from '@/entities/auth'
import { useZodForm } from '@/shared/lib/use-zod-form'
import { useLogin } from '@/features/auth/mutations'
import { FormError, FormField, TextInput } from '@/shared/ui/form-field'
import { PasswordInput } from '@/shared/ui/password-input'
import { Button } from '@/shared/ui/button'

export function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const form = useZodForm(loginInputSchema)
  const login = useLogin()

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const values = form.validate({ email, password })
    if (!values) return

    login.mutate(values, {
      onSuccess,
      onError: (error) =>
        form.applyError(error, 'Não foi possível entrar. Tente novamente.'),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormError message={form.formError} />

      <FormField label="E-mail" error={form.fieldErrors.email}>
        {(props) => (
          <TextInput
            {...props}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="contato@email.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value)
              form.clearField('email')
            }}
          />
        )}
      </FormField>

      <FormField label="Senha" error={form.fieldErrors.password}>
        {(props) => (
          <PasswordInput
            {...props}
            name="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value)
              form.clearField('password')
            }}
          />
        )}
      </FormField>

      <div className="flex justify-end">
        {/* Password recovery is outside the delivery scope. */}
        <span
          aria-disabled="true"
          title="Recuperação de senha fora do escopo desta entrega"
          className="cursor-not-allowed text-body text-text-accent/70"
        >
          Esqueceu a senha?
        </span>
      </div>

      <Button
        type="submit"
        disabled={login.isPending}
        className="mt-3 h-[45px] font-bold"
      >
        {login.isPending ? 'Entrando…' : 'Entrar'}
      </Button>
    </form>
  )
}
