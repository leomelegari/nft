import { useState } from 'react'
import { profileInputSchema, type User } from '@/entities/auth'
import { useZodForm } from '@/shared/lib/use-zod-form'
import { useUpdateProfile } from '@/features/account/mutations'
import { AvatarField } from '@/features/account/avatar-field'
import { Button } from '@/shared/ui/button'
import { FormError, FormField, TextInput } from '@/shared/ui/form-field'

/**
 * Collector profile fields.
 *
 * The Figma's two-column grid is kept, but the fields are the account's real
 * ones. "Nome de usuário" and "Nome ENS" have no value behind them on this
 * screen — nothing stores or reads them — and "Apelido da carteira" belongs to
 * a wallet, where it already exists and is editable. "Bio" and "Localização"
 * take their places: they are the rest of the collector profile the API
 * exposes, and without them this screen could not edit half of it.
 */
export function ProfileForm({ user }: { user: User }) {
  const [values, setValues] = useState({
    name: user.name,
    email: user.email,
    bio: user.bio,
    location: user.location,
  })
  const [saved, setSaved] = useState(false)

  const form = useZodForm(profileInputSchema)
  const update = useUpdateProfile()

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
    form.clearField(key)
    setSaved(false)
  }

  function submit(event: React.FormEvent) {
    event.preventDefault()

    const parsed = form.validate(values)
    if (!parsed) return

    update.mutate(parsed, {
      onSuccess: () => setSaved(true),
      onError: (error) =>
        form.applyError(error, 'Não foi possível salvar o perfil. Tente novamente.'),
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <FormError message={form.formError} />

      <div className="grid gap-x-7 gap-y-6 lg:grid-cols-2">
        <FormField label="Nome de exibição" required error={form.fieldErrors.name}>
          {(props) => (
            <TextInput
              {...props}
              required
              name="name"
              autoComplete="name"
              value={values.name}
              onChange={(event) => set('name', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="E-mail" required error={form.fieldErrors.email}>
          {(props) => (
            <TextInput
              {...props}
              required
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => set('email', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="Localização" error={form.fieldErrors.location}>
          {(props) => (
            <TextInput
              {...props}
              name="location"
              autoComplete="address-level2"
              placeholder="Cidade, país"
              value={values.location}
              onChange={(event) => set('location', event.target.value)}
            />
          )}
        </FormField>

        <AvatarField user={user} />

        <FormField
          label="Bio"
          error={form.fieldErrors.bio}
          hint={`${values.bio.length}/280 caracteres`}
        >
          {(props) => (
            <textarea
              {...props}
              name="bio"
              rows={4}
              maxLength={280}
              value={values.bio}
              onChange={(event) => set('bio', event.target.value)}
              className="w-full rounded-[5px] border border-border bg-card px-4 py-3 text-body text-foreground placeholder:text-brand-secondary focus-visible:outline-ring aria-invalid:border-danger"
            />
          )}
        </FormField>
      </div>

      <div className="flex items-center gap-4">
        <Button
          type="submit"
          disabled={update.isPending}
          className="h-10 w-[131px] rounded-[3px] font-bold"
        >
          {update.isPending ? 'Salvando…' : 'Salvar'}
        </Button>

        <span role="status" aria-live="polite" className="text-body-md text-success">
          {saved && 'Perfil atualizado'}
        </span>
      </div>
    </form>
  )
}
