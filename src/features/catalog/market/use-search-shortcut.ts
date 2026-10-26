import { useEffect } from 'react'

/**
 * Focuses the market's search field when "/" is pressed.
 *
 * The convention on a browsing surface, and cheap to support here because the
 * field is always on screen. It deliberately does nothing while the user is
 * already typing somewhere — including in a `contenteditable` — so the
 * shortcut can never swallow a literal slash.
 */
export function useSearchShortcut(inputId: string): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return

      const target = event.target
      if (target instanceof HTMLElement && isTextEntry(target)) return

      const input = document.getElementById(inputId)
      if (!(input instanceof HTMLInputElement)) return

      // Otherwise the slash that triggered this lands in the field.
      event.preventDefault()
      input.focus()
      input.select()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inputId])
}

function isTextEntry(element: HTMLElement): boolean {
  return (
    element.isContentEditable ||
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  )
}
