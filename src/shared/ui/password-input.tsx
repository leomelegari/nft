import { useState } from 'react'
import { TextInput } from '@/shared/ui/form-field'
import { cn } from '@/shared/lib/utils'

/** Password field with the design's show/hide toggle. */
export function PasswordInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative w-full">
      <TextInput
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn('pr-11', className)}
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        aria-pressed={visible}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-0.5 text-text-secondary transition-colors hover:text-foreground focus-visible:outline-ring"
      >
        <svg viewBox="0 0 22 20" className="size-5" fill="none" aria-hidden="true">
          <path
            d="M1.5 10S5 3.5 11 3.5 20.5 10 20.5 10 17 16.5 11 16.5 1.5 10 1.5 10Z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="11" cy="10" r="2.75" stroke="currentColor" strokeWidth="1.5" />
          {!visible && (
            <path
              d="M3 18 19 2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          )}
        </svg>
      </button>
    </div>
  )
}
