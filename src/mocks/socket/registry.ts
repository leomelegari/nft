import type { RealtimeEvent } from '@/entities/events'

/**
 * Connected simulated clients.
 *
 * The REST handlers publish through here whenever they change data, so a
 * mutation and the event announcing it cannot disagree — the brief requires
 * changes in the mock data to be reflected in both the REST responses and the
 * corresponding events.
 */
type Emitter = (event: RealtimeEvent) => void

interface Subscriber {
  id: string
  socketSessionId: string | null
  emit: Emitter
  /**
   * Liveness check.
   *
   * Neither the Socket.IO `disconnect` packet nor the underlying WebSocket
   * `close` event reaches us through the protocol binding, so a closed client
   * cannot unregister itself. MSW tracks live clients per link, and asking it
   * before each publish is authoritative — a stale subscriber is dropped the
   * first time anything is published.
   */
  isAlive: () => boolean
}

const subscribers = new Map<string, Subscriber>()

export function registerSubscriber(subscriber: Subscriber): () => void {
  subscribers.set(subscriber.id, subscriber)
  return () => subscribers.delete(subscriber.id)
}

export function setSubscriberSession(id: string, socketSessionId: string | null): void {
  const subscriber = subscribers.get(id)
  if (subscriber) subscriber.socketSessionId = socketSessionId
}

/**
 * Publishes an event.
 *
 * An event carrying a `sessionId` reaches only the client that owns that
 * session, which is what stops an event produced for one user from updating
 * another user's cache. `sessionId: null` is a broadcast — catalog data is not
 * private.
 */
function prune(): void {
  for (const [id, subscriber] of subscribers) {
    if (!subscriber.isAlive()) subscribers.delete(id)
  }
}

export function publish(event: RealtimeEvent): void {
  prune()

  for (const subscriber of subscribers.values()) {
    if (event.sessionId !== null && subscriber.socketSessionId !== event.sessionId) {
      continue
    }
    subscriber.emit(event)
  }
}

export function subscriberCount(): number {
  prune()
  return subscribers.size
}
