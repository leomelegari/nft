import { useCallback, useState } from 'react'
import type { z } from 'zod'
import { isApiError } from '@/shared/api'

/**
 * Minimal form state for schema-validated forms.
 *
 * The same Zod schema validates on the client and in the simulated server, so
 * the two cannot disagree about what is valid. Field errors returned by the API
 * (`error.fields`) are merged into the same map the client validation writes
 * to, which means a message bound to an input looks identical whether it came
 * from local validation or from the server.
 */
export function useZodForm<TSchema extends z.ZodType>(schema: TSchema) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const reset = useCallback(() => {
    setFieldErrors({})
    setFormError(null)
  }, [])

  /** Validates raw values; returns parsed data or `null` after recording errors. */
  const validate = useCallback(
    (values: unknown): z.infer<TSchema> | null => {
      const parsed = schema.safeParse(values)
      if (parsed.success) {
        reset()
        return parsed.data
      }

      const errors: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path.join('.') || '_'
        errors[key] ??= issue.message
      }

      setFieldErrors(errors)
      setFormError(null)
      return null
    },
    [schema, reset],
  )

  /** Records a failed submission, splitting field errors from the summary. */
  const applyError = useCallback((error: unknown, fallback: string) => {
    if (isApiError(error)) {
      setFieldErrors({ ...error.fields })
      // A message that is already attached to a field would otherwise be shown
      // twice — once in the summary and once under the input.
      setFormError(Object.keys(error.fields).length > 0 ? null : error.message)
      return
    }
    setFieldErrors({})
    setFormError(fallback)
  }, [])

  const clearField = useCallback((field: string) => {
    setFieldErrors((current) => {
      if (!(field in current)) return current
      const next = { ...current }
      delete next[field]
      return next
    })
  }, [])

  return { fieldErrors, formError, validate, applyError, reset, clearField }
}
