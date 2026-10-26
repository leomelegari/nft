/**
 * Bridge between the transport layer and the session cache.
 *
 * The Axios interceptor cannot import React Query, and the query client cannot
 * be imported by the interceptor without a cycle, so expiry is published here
 * and the app subscribes once at startup.
 */
type Listener = () => void

const listeners = new Set<Listener>()

export function onSessionInvalidated(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function notifySessionInvalidated(): void {
  for (const listener of listeners) listener()
}
