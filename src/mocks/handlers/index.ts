import type { RequestHandler } from 'msw'

/**
 * Every REST handler for the simulated backend is registered here.
 * Components, hooks and the Axios client must never contain fallback data or
 * alternate business paths — the network layer is the only source of truth.
 */
export const handlers: RequestHandler[] = []
