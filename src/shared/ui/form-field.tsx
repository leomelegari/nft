import { useId } from 'react'
import { cn } from '@/shared/lib/utils'

/**
 * Labelled field with an error message bound to the input.
 *
 * `aria-describedby` points at the error and `aria-invalid` marks the control,
 * which is what makes a validation message reachable by a screen reader — the
 * design communicates invalid state with a border colour alone.
 */
export function FormField({
  label,
  error,
  hint,
  children,
  labelVisible = true,
}: {
  label: string
  error?: string | undefined
  hint?: string | undefined
  labelVisible?: boolean
  children: (props: {
    id: string
    'aria-invalid': boolean
    'aria-describedby': string | undefined
  }) => React.ReactNode
}) {
  const id = useId()
  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label
        htmlFor={id}
        className={cn(
          'text-body-md font-medium text-foreground',
          !labelVisible && 'sr-only',
        )}
      >
        {label}
      </label>

      {children({
        id,
        'aria-invalid': Boolean(error),
        'aria-describedby': describedBy || undefined,
      })}

      {hint && (
        <p id={hintId} className="text-caption text-text-secondary">
          {hint}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export function TextInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'h-10 w-full rounded-[5px] border border-border bg-card px-4 text-body text-foreground transition-colors placeholder:text-brand-secondary focus-visible:outline-ring aria-invalid:border-danger',
        className,
      )}
    />
  )
}

/** Non-field-level failure, e.g. a rejected credential pair. */
export function FormError({ message }: { message: string | null }) {
  if (!message) return null

  return (
    <p
      role="alert"
      className="rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-body text-danger"
    >
      {message}
    </p>
  )
}
