/**
 * Coupon catalogue for the simulation. Codes are matched case-insensitively.
 * Anything not listed is COUPON_INVALID; listed-but-expired is COUPON_EXPIRED,
 * so both failure paths from section 3 have deterministic triggers.
 */
export interface MockCoupon {
  code: string
  description: string
  percentOff: number
  expiresAt: string | null
}

export const MOCK_COUPONS: readonly MockCoupon[] = [
  {
    code: 'GREENMINT10',
    description: '10% de desconto na primeira coleção',
    percentOff: 10,
    expiresAt: null,
  },
  {
    code: 'DROP20',
    description: '20% de desconto em lançamentos selecionados',
    percentOff: 20,
    expiresAt: null,
  },
  {
    code: 'EXPIRADO15',
    description: 'Campanha de inverno encerrada',
    percentOff: 15,
    expiresAt: new Date(Date.UTC(2025, 7, 31)).toISOString(),
  },
]

export function findCoupon(code: string): MockCoupon | undefined {
  const normalized = code.trim().toUpperCase()
  return MOCK_COUPONS.find((coupon) => coupon.code === normalized)
}

export function isExpired(coupon: MockCoupon, now = new Date()): boolean {
  return coupon.expiresAt !== null && new Date(coupon.expiresAt) < now
}
