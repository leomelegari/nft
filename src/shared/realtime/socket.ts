import type { Socket } from 'socket.io-client'

/**
 * The application's single Socket.IO connection.
 *
 * This is a real `socket.io-client`. In development, demo and tests the other
 * end is the simulated server in `src/mocks/socket`; swapping in a real server
 * would require no change here.
 *
 * **The import is dynamic on purpose.** `socket.io-client` captures a
 * reference to `window.WebSocket` when its module first evaluates. MSW patches
 * `window.WebSocket` when the worker starts, so a static import — pulled in
 * through the app's module graph before `startMocks()` runs — would bind the
 * *unpatched* constructor and every connection would bypass the mock layer
 * entirely. Loading it lazily, after startup, guarantees the patched one.
 *
 * It also keeps the client out of the initial bundle.
 *
 * `transports: ['websocket']` skips the HTTP long-polling handshake, which the
 * mock layer does not implement.
 */
let socketPromise: Promise<Socket> | null = null

export function getSocket(): Promise<Socket> {
  socketPromise ??= import('socket.io-client').then(({ io }) =>
    io(window.location.origin, {
      path: '/socket.io',
      transports: ['websocket'],
      autoConnect: false,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
    }),
  )
  return socketPromise
}

/** Tears the connection down for good; the server releases its subscriber. */
export async function disposeSocket(): Promise<void> {
  if (!socketPromise) return
  const socket = await socketPromise
  if (socket.connected) socket.emit('bye')
  socket.removeAllListeners()
  socket.disconnect()
  socketPromise = null
}
