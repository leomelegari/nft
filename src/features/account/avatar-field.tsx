import { useRef, useState } from 'react'
import ImagePlaceholderIcon from '@/assets/icons/image-placeholder.svg?react'
import type { User } from '@/entities/auth'
import { isApiError } from '@/shared/api'
import { useRemoveAvatar, useUpdateAvatar } from '@/features/account/mutations'
import { Button } from '@/shared/ui/button'

/** Anything larger is rejected before it is read, not after. */
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

/**
 * Avatar preview with the design's "Alterar" and "Remover" controls.
 *
 * The file input itself stays visually hidden and is driven by the button: a
 * native file input cannot be styled into the design, but replacing it with a
 * plain button would lose keyboard and screen-reader support, so the real
 * control is kept and labelled.
 */
export function AvatarField({ user }: { user: User }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const update = useUpdateAvatar()
  const remove = useRemoveAvatar()

  const busy = update.isPending || remove.isPending

  async function select(file: File) {
    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError('A imagem deve ter no máximo 2 MB.')
      return
    }

    let dataUrl: string
    try {
      dataUrl = await readAsDataUrl(file)
    } catch {
      setError('Não foi possível ler o arquivo selecionado.')
      return
    }

    update.mutate(dataUrl, {
      onError: (mutationError) =>
        setError(
          isApiError(mutationError)
            ? mutationError.message
            : 'Não foi possível atualizar o avatar.',
        ),
    })
  }

  return (
    <div className="flex w-full flex-col gap-1.5">
      <span className="text-body-md font-medium text-foreground">Avatar</span>

      <div className="flex items-center gap-5">
        <span className="flex size-[50px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary text-text-secondary">
          {user.avatar ? (
            <img
              src={user.avatar}
              alt={`Avatar de ${user.name}`}
              width={50}
              height={50}
              className="size-full object-cover"
            />
          ) : (
            <ImagePlaceholderIcon aria-hidden="true" />
          )}
        </span>

        <div className="flex items-center gap-5">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Escolher imagem de avatar"
            onChange={(event) => {
              const file = event.target.files?.[0]
              // Reset so choosing the same file twice still fires a change.
              event.target.value = ''
              if (file) void select(file)
            }}
          />

          <Button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="h-10 w-[98px] rounded-[3px] font-bold"
          >
            {update.isPending ? 'Enviando…' : 'Alterar'}
          </Button>

          {user.avatar && (
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                remove.mutate(undefined, {
                  onError: () => setError('Não foi possível remover o avatar.'),
                })
              }
              className="rounded-sm text-body-md text-foreground underline underline-offset-4 transition-colors hover:text-text-accent focus-visible:outline-ring disabled:opacity-60"
            >
              {remove.isPending ? 'Removendo…' : 'Remover'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('unexpected result'))
    reader.readAsDataURL(file)
  })
}
