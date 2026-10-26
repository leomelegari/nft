import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/providers'
import { startMocks } from '@/mocks/enable'
import '@/index.css'

async function bootstrap() {
  // The mock layer must be intercepting before the first query fires, otherwise
  // the initial catalog request escapes to the network.
  await startMocks()

  const container = document.getElementById('root')
  if (!container) throw new Error('Root container #root not found')

  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
