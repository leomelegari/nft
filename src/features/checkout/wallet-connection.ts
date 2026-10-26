import { useCallback, useState } from 'react'
import type { Wallet } from '@/entities/auth'

/**
 * Simulated wallet connection.
 *
 * Real wallet extensions are out of scope, so connection is simulated — but it
 * is simulated with the states a real one has, because the brief requires
 * connect, refusal and disconnection to be exercised: a user can reject the
 * prompt, and a connected wallet can be disconnected.
 *
 * Deterministic: refusal is triggered explicitly by the user through the
 * "recusar" action in the prompt, never at random, so a test can reproduce it.
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'refused'

const CONNECT_LATENCY_MS = 700

export function useWalletConnection() {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null)
  const [pending, setPending] = useState<Wallet | null>(null)

  /** Opens the simulated provider prompt for a wallet. */
  const requestConnection = useCallback((wallet: Wallet) => {
    setPending(wallet)
    setStatus('connecting')
  }, [])

  const approve = useCallback(() => {
    if (!pending) return
    const wallet = pending
    window.setTimeout(() => {
      setConnectedWalletId(wallet.id)
      setStatus('connected')
      setPending(null)
    }, CONNECT_LATENCY_MS)
  }, [pending])

  const refuse = useCallback(() => {
    setStatus('refused')
    setPending(null)
    setConnectedWalletId(null)
  }, [])

  const disconnect = useCallback(() => {
    setStatus('disconnected')
    setConnectedWalletId(null)
    setPending(null)
  }, [])

  return {
    status,
    pending,
    connectedWalletId,
    requestConnection,
    approve,
    refuse,
    disconnect,
    isConnected: status === 'connected',
  }
}
