import Decimal from 'decimal.js'

/**
 * ETH amounts travel the wire as decimal strings and are never converted to
 * `number` anywhere in the application. `Number` cannot represent 0.1 + 0.2
 * exactly, and a marketplace that rounds a total by one wei is wrong.
 *
 * This module is the ONLY place ETH arithmetic happens. Everything else passes
 * opaque `EthAmount` strings around.
 */

/** Wei-level precision is 18 decimals; the catalog quotes at 8, which is plenty. */
export const ETH_DECIMALS = 8

Decimal.set({
  precision: 40,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -30,
  toExpPos: 40,
})

/** A non-negative decimal string, e.g. "1.19". Branded to block raw-string misuse. */
export type EthAmount = string & { readonly __brand: 'EthAmount' }

export const ETH_AMOUNT_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthAmount(value: string): boolean {
  return ETH_AMOUNT_PATTERN.test(value)
}

export function toEth(value: string | number | Decimal): EthAmount {
  const decimal = new Decimal(value)
  if (decimal.isNegative() || !decimal.isFinite()) {
    throw new RangeError(`Invalid ETH amount: ${String(value)}`)
  }
  return decimal.toFixed(ETH_DECIMALS).replace(/\.?0+$/, '') as EthAmount
}

export function addEth(...amounts: EthAmount[]): EthAmount {
  return toEth(amounts.reduce((sum, amount) => sum.plus(amount), new Decimal(0)))
}

export function subEth(minuend: EthAmount, subtrahend: EthAmount): EthAmount {
  const result = new Decimal(minuend).minus(subtrahend)
  // Totals are clamped at zero: a discount larger than the subtotal must not
  // produce a negative charge.
  return toEth(result.isNegative() ? new Decimal(0) : result)
}

export function mulEth(amount: EthAmount, quantity: number): EthAmount {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantity must be a non-negative integer, received ${quantity}`)
  }
  return toEth(new Decimal(amount).times(quantity))
}

/** Applies a percentage discount, e.g. `percentOfEth(total, 10)` for 10% off. */
export function percentOfEth(amount: EthAmount, percent: number): EthAmount {
  return toEth(new Decimal(amount).times(percent).dividedBy(100))
}

export function compareEth(left: EthAmount, right: EthAmount): -1 | 0 | 1 {
  return new Decimal(left).comparedTo(right) as -1 | 0 | 1
}

export function eqEth(left: EthAmount, right: EthAmount): boolean {
  return compareEth(left, right) === 0
}

export function gtEth(left: EthAmount, right: EthAmount): boolean {
  return compareEth(left, right) === 1
}
