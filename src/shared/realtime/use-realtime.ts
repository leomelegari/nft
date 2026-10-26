import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { realtimeEventSchema } from '@/entities/events'
import { queryKeys } from '@/shared/api/query-keys'
import { getSessionToken } from '@/shared/api'
import { useOwnerKey } from '@/features/auth/queries'
import { getSocket } from '@/shared/realtime/socket'
import { VersionLedger } from '@/shared/realtime/version-ledger'
import { applyNftUpdated, applyOrderUpdated } from '@/shared/realtime/apply-events'

/**
 * Subscribes the cache to realtime updates.
 *
 * Mounted once, at the application root. Four guarantees the brief asks for
 * are implemented here:
 *
 * - **Duplicates and stale events** are dropped by the version ledger before
 *   they reach the cache, so no effect is ever reapplied.
 * - **Events are validated** against their contract; a malformed payload is
 *   ignored rather than written into the cache.
 * - **Reconnection reconciles** with REST: active queries are invalidated on
 *   reconnect, because events that occurred while the socket was down were
 *   never delivered and cannot be replayed.
 * - **Listeners are released** on unmount and whenever the identity changes,
 *   so a previous session's subscription cannot outlive it.
 */
export function useRealtime(): void {
  const queryClient = useQueryClient()
  const ownerKey = useOwnerKey()
  const ledgerRef = useRef(new VersionLedger())

  useEffect(() => {
    let disposed = false
    let detach: (() => void) | undefined

    const ledger = ledgerRef.current
    // Identity changed: previous versions belong to a cache that is gone.
    ledger.clear()

    void getSocket().then((socket) => {
      if (disposed) return

      const announceSession = () => socket.emit('session', getSessionToken())

      /**
       * A reconnect means there is a gap: anything that happened while the
       * socket was down was never delivered. REST is the authority, so active
       * resources are refetched rather than assumed unchanged.
       */
      const handleReconnect = () => {
        announceSession()
        ledger.clear()
        void queryClient.invalidateQueries({ queryKey: queryKeys.nfts.all() })
        void queryClient.invalidateQueries({ queryKey: ['owner', ownerKey] })
      }

      const handleEvent = (raw: unknown) => {
        const parsed = realtimeEventSchema.safeParse(raw)
        if (!parsed.success) return

        const event = parsed.data
        if (!ledger.accept(event.resourceId, event.version)) return

        if (event.type === 'nft.updated') {
          applyNftUpdated(queryClient, event)
        } else {
          applyOrderUpdated(queryClient, ownerKey, event)
        }
      }

      socket.on('connect', announceSession)
      socket.io.on('reconnect', handleReconnect)
      socket.on('nft.updated', handleEvent)
      socket.on('order.updated', handleEvent)

      if (socket.connected) announceSession()
      else socket.connect()

      detach = () => {
        /**
         * Only the listeners are removed here. The server-side subscriber is
         * bound to the *connection*, which outlives this effect — the effect
         * re-runs whenever the identity changes, and announcing `bye` then
         * would drop a subscriber that no new `connection` event would ever
         * recreate. Re-running simply re-announces the session instead.
         */
        socket.off('connect', announceSession)
        socket.io.off('reconnect', handleReconnect)
        socket.off('nft.updated', handleEvent)
        socket.off('order.updated', handleEvent)
      }
    })

    return () => {
      disposed = true
      detach?.()
    }
  }, [queryClient, ownerKey])
}
