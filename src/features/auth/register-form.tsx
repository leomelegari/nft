import { useState } from 'react'
import { registerInputSchema } from '@/entities/auth'
import { useZodForm } from '@/shared/lib/use-zod-form'
import { useRegister } from '@/features/auth/mutations'
import { FormError, FormField, TextInput } from '@/shared/ui/form-field'
import { PasswordInput } from '@/shared/ui/password-input'
import { Button } from '@/shared/ui/button'

export function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [values, setValues] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    acceptedTerms: false,
  })

  const form = useZodForm(registerInputSchema)
  const register = useRegister()

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    form.clearField(key)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = form.validate(values)
    if (!parsed) return

    register.mutate(parsed, {
      onSuccess,
      onError: (error) =>
        form.applyError(error, 'Não foi possível criar a conta. Tente novamente.'),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-3">
      <FormError message={form.formError} />

      <FormField label="Nome" error={form.fieldErrors.name}>
        {(props) => (
          <TextInput
            {...props}
            name="name"
            autoComplete="name"
            placeholder="Seu nome"
            value={values.name}
            onChange={(event) => set('name', event.target.value)}
          />
        )}
      </FormField>

      <FormField label="E-mail" error={form.fieldErrors.email}>
        {(props) => (
          <TextInput
            {...props}
            type="email"
            name="email"
            autoComplete="email"
            placeholder="contato@email.com"
            value={values.email}
            onChange={(event) => set('email', event.target.value)}
          />
        )}
      </FormField>

      <FormField
        label="Senha"
        error={form.fieldErrors.password}
        hint="Mínimo de 8 caracteres, com maiúscula, minúscula e número."
      >
        {(props) => (
          <PasswordInput
            {...props}
            name="password"
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.password}
            onChange={(event) => set('password', event.target.value)}
          />
        )}
      </FormField>

      <FormField label="Confirmar senha" error={form.fieldErrors.passwordConfirmation}>
        {(props) => (
          <PasswordInput
            {...props}
            name="passwordConfirmation"
            autoComplete="new-password"
            placeholder="••••••••"
            value={values.passwordConfirmation}
            onChange={(event) => set('passwordConfirmation', event.target.value)}
          />
        )}
      </FormField>

      <FormField
        label="Termos"
        error={form.fieldErrors.acceptedTerms}
        labelVisible={false}
      >
        {(props) => (
          <label className="flex items-start gap-2.5 text-caption-lg text-text-secondary">
            <input
              {...props}
              type="checkbox"
              name="acceptedTerms"
              checked={values.acceptedTerms}
              onChange={(event) => set('acceptedTerms', event.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span>Li e aceito os termos de uso e a política de privacidade.</span>
          </label>
        )}
      </FormField>

      <Button
        type="submit"
        disabled={register.isPending}
        className="mt-3 h-[45px] font-bold"
      >
        {register.isPending ? 'Criando conta…' : 'Criar conta'}
      </Button>
    </form>
  )
}
