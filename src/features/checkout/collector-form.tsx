import type { CollectorInput } from '@/entities/order'
import { FormField, TextInput } from '@/shared/ui/form-field'

/**
 * Collector profile fields from the payment screen.
 *
 * The Figma marks every field required, including "Código de indicação" and
 * "Nome ENS". A referral code cannot be mandatory — nobody without one could
 * ever buy — so the optional fields are labelled optional here and only the
 * ones the order genuinely needs carry the required marker.
 *
 * "Rede", "Endereço da carteira" and "Tipo de carteira" are not duplicated
 * here; they follow from the wallet chosen in the summary panel.
 */
export function CollectorForm({
  values,
  errors,
  onChange,
}: {
  values: CollectorInput
  errors: Record<string, string>
  onChange: <K extends keyof CollectorInput>(key: K, value: CollectorInput[K]) => void
}) {
  return (
    <section aria-labelledby="collector-heading" className="flex min-w-0 flex-col gap-3">
      <h2 id="collector-heading" className="text-body-xl font-bold text-foreground">
        Perfil do colecionador
      </h2>

      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
        <FormField label="Nome de exibição *" error={errors.displayName}>
          {(props) => (
            <TextInput
              {...props}
              name="displayName"
              autoComplete="name"
              value={values.displayName}
              onChange={(event) => onChange('displayName', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="Nome de usuário *" error={errors.username}>
          {(props) => (
            <TextInput
              {...props}
              name="username"
              autoComplete="username"
              value={values.username}
              onChange={(event) => onChange('username', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="E-mail *" error={errors.email}>
          {(props) => (
            <TextInput
              {...props}
              type="email"
              name="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => onChange('email', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="Nome do perfil (opcional)" error={errors.profileName}>
          {(props) => (
            <TextInput
              {...props}
              name="profileName"
              value={values.profileName}
              onChange={(event) => onChange('profileName', event.target.value)}
            />
          )}
        </FormField>

        <FormField label="Código de indicação (opcional)" error={errors.referralCode}>
          {(props) => (
            <TextInput
              {...props}
              name="referralCode"
              value={values.referralCode}
              onChange={(event) => onChange('referralCode', event.target.value)}
            />
          )}
        </FormField>
      </div>

      <FormField label="Observação do colecionador (opcional)" error={errors.note}>
        {(props) => (
          <textarea
            {...props}
            name="note"
            rows={5}
            value={values.note}
            onChange={(event) => onChange('note', event.target.value)}
            className="w-full rounded-[3px] border border-border bg-card px-4 py-3 text-body text-foreground placeholder:text-brand-secondary focus-visible:outline-ring aria-invalid:border-danger"
          />
        )}
      </FormField>
    </section>
  )
}
