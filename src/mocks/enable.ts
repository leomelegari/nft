/**
 * The mock layer is activated by configuration and ships in the demo build,
 * as required by the brief (section 6). `VITE_ENABLE_MOCKS=false` disables it.
 */
export function mocksEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MOCKS !== 'false'
}

export async function startMocks(): Promise<void> {
  if (!mocksEnabled()) return

  const { worker } = await import('@/mocks/browser')

  await worker.start({
    // Unhandled requests are a bug in the mock layer, not a reason to hit the
    // network — surface them loudly in development.
    onUnhandledFrame: 'warn',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  })
}
