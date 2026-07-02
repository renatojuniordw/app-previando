/**
 * Input mask utility functions.
 *
 * All masks format a raw (unstripped) value string and return the masked version.
 * Use `stripNonDigits(value).slice(0, maxLen)` before calling format functions
 * to ensure consistent behavior.
 */

/** Remove all non-digit characters */
export function stripNonDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Format raw digits as CPF: XXX.XXX.XXX-XX
 * Accepts up to 11 digits.
 */
export function formatCPF(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11)
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2')
}

/**
 * Format raw digits as Brazilian phone number.
 * - 10 digits: (XX) XXXX-XXXX
 * - 11 digits: (XX) XXXXX-XXXX (mobile with 9)
 * Accepts up to 11 digits.
 */
export function formatPhone(value: string): string {
  const digits = stripNonDigits(value).slice(0, 11)
  return digits
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
}

/**
 * Format raw digits as CNJ process number: NNNNNNN-DD.AAAA.J.TR.OOOO
 * Accepts up to 20 digits.
 */
export function formatCNJ(value: string): string {
  const digits = stripNonDigits(value).slice(0, 20)
  return digits
    .replace(/^(\d{7})(\d)/, '$1-$2')
    .replace(/^(.{10})(\d)/, '$1.$2')
    .replace(/^(.{13})(\d)/, '$1.$2')
    .replace(/^(.{15})(\d)/, '$1.$2')
    .replace(/^(.{17})(\d)/, '$1.$2')
}

/**
 * Format raw digits as BRL currency value for display.
 * Returns a string like "1.234,56" (without the R$ symbol).
 * The value is in cents — e.g., "123456" → "1.234,56".
 */
export function formatCurrencyDisplay(rawValue: string): string {
  const digits = stripNonDigits(rawValue)
  if (!digits || digits === '0') return ''

  // Pad to at least 3 digits (2 for cents + at least 1 for reais)
  const padded = digits.padStart(3, '0')
  const reais = padded.slice(0, -2)
  const cents = padded.slice(-2)

  // Add thousands separator
  const formattedReais = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${formattedReais},${cents}`
}

/**
 * Parse a currency display string back to a number.
 * "1.234,56" → 1234.56
 */
export function parseCurrency(value: string): number {
  if (!value) return 0
  const cleaned = value.replace(/\./g, '').replace(',', '.')
  return Number(cleaned)
}

/**
 * Mask a CNJ process number for display: NNNNNNN-DD.AAAA.J.TR.OOOO
 */
export function displayCNJ(value: string): string {
  const cleaned = value.replace(/[^\dA-Za-z]/g, '')
  if (cleaned.length !== 20) return value
  return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14, 16)}.${cleaned.slice(16, 20)}`
}
