import Decimal from 'decimal.js'
import type { EthAmount } from '@/shared/money/eth'

/**
 * Presentation helpers. The Figma shows prices as "1.19 ETH" in the catalog and
 * the price-range filter as "0,02 - 12,30 ETH" (pt-BR decimal comma), so the
 * two formats are deliberately separate rather than one "smart" formatter.
 */

const CATALOG_FRACTION_DIGITS = 2

/** "1.19 ETH" — catalog, detail and cart line items. */
export function formatEth(amount: EthAmount, { suffix = true } = {}): string {
  const value = new Decimal(amount).toFixed(CATALOG_FRACTION_DIGITS)
  return suffix ? `${value} ETH` : value
}

/** "0,02" — pt-BR localised, used by the price-range filter label. */
export function formatEthLocale(amount: EthAmount): string {
  return new Decimal(amount).toFixed(CATALOG_FRACTION_DIGITS).replace('.', ',')
}

/** Full precision, for the order receipt where rounding would be a lie. */
export function formatEthExact(amount: EthAmount): string {
  return `${new Decimal(amount).toFixed()} ETH`
}
