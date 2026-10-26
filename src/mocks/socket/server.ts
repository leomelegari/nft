import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import { getDb } from '@/mocks/db/store'
import { registerSubscriber, setSubscriberSession } from '@/mocks/socket/registry'

/**
 * Simulated Socket.IO server.
 *
 * The client is a real `socket.io-client`; this is the other end of the wire,
 * implemented with MSW's WebSocket interception plus the Socket.IO protocol
 * binding. Nothing here calls into the application's state — events travel
 * over the socket exactly as they would from a real server.
 *
 * The link pattern is `*` because MSW's WebSocket path matching does not take
 * the query string into account, and `socket.io-client` always appends
 * `?EIO=4&transport=websocket`. Every other socket — notably Vite's HMR
 * channel — is explicitly passed through to the real server below.
 */
const SOCKET_PATH = '/socket.io/'

const link = ws.link('*')

let connectionSequence = 0

export const socketHandlers = [
  link.addEventListener('connection', (connection) => {
    const url = new URL(connection.client.url)

    // Not our socket: let it reach the real server untouched.
    if (!url.pathname.startsWith(SOCKET_PATH)) {
      connection.server.connect()
      return
    }

    const io = toSocketIo(connection)
    connectionSequence += 1
    const subscriberId = `sub_${connectionSequence}`

    const unregister = registerSubscriber({
      id: subscriberId,
      socketSessionId: null,
      emit: (event) => {
        io.client.emit(event.type, event)
      },
      isAlive: () => link.clients.has(connection.client),
    })

    /**
     * The client identifies its session after connecting, so events scoped to
     * a session reach only that client. A client that signs out sends `null`
     * and stops receiving them.
     */
    io.client.on('session', (...args: unknown[]) => {
      const token = typeof args[0] === 'string' ? args[0] : null
      const session = token
        ? (getDb().sessions.find((item) => item.token === token) ?? null)
        : null
      setSubscriberSession(subscriberId, session?.socketSessionId ?? null)
    })

    /**
     * Release the subscription when the client goes away.
     *
     * The client announces its departure with `bye` before disconnecting,
     * which covers sign-out and unmount — the life-cycle events the brief
     * cares about. The Socket.IO `disconnect` packet and the WebSocket `close`
     * event are also wired, but neither reaches us through the protocol
     * binding, so an abrupt close (tab killed) is cleaned up by the registry's
     * liveness prune on the next publish instead. See ARCHITECTURE.md.
     */
    io.client.on('bye', unregister)
    io.client.on('disconnect', unregister)
    connection.client.addEventListener('close', unregister)
  }),
]
