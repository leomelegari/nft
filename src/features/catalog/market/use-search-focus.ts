import { useEffect } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'

/**
 * Lets a navigation ask the market screen to focus its search field.
 *
 * This is history state rather than a search param on purpose: wanting the
 * cursor in the field is a property of *this* navigation, not of the view
 * being described. It must not end up in a shared link, and a reader who
 * refreshes should not have focus taken from them again.
 */
declare module '@tanstack/react-router' {
  interface HistoryState {
    focusSearch?: boolean
  }
}

/** What the header's search button passes when it sends the user here. */
export const FOCUS_SEARCH_STATE = { focusSearch: true } as const

/**
 * Focuses the search field when a navigation asked for it.
 *
 * The request is consumed once applied, so going away and coming back through
 * history does not steal focus from whatever the reader is doing then.
 */
export function useFocusSearchRequest(inputId: string): void {
  const navigate = useNavigate()
  const requested = useRouterState({
    select: (state) => state.location.state.focusSearch === true,
  })

  useEffect(() => {
    if (!requested) return

    const input = document.getElementById(inputId)
    if (input instanceof HTMLInputElement) {
      input.focus()
      input.select()
    }

    void navigate({
      to: '.',
      replace: true,
      // Dropped rather than set to `undefined`: the flag's absence is what
      // "not requested" means, and `exactOptionalPropertyTypes` is on.
      state: ({ focusSearch: _consumed, ...rest }) => rest,
    })
  }, [requested, inputId, navigate])
}

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
