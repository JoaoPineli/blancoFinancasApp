/**
 * Currency formatting composable.
 * Per guardrails: This is PRESENTATION ONLY.
 * No logic may depend on formatted values.
 * Parsing formatted currency back into numbers is FORBIDDEN.
 */

export function useCurrency() {
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })

  const percentFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  /**
   * Formats a monetary value for display.
   * Input should be provided by backend as cents (integer) or fixed-precision string.
   * Per guardrails: This is presentation only - never use formatted values for calculations.
   *
   * @param valueInCents - The value in cents (integer) from the backend
   */
  function formatCurrency(valueInCents: number): string {
    // Convert cents to reais for display only
    const valueInReais = valueInCents / 100
    return formatter.format(valueInReais)
  }

  /**
   * Formats a percentage value for display.
   * Input should be a decimal (e.g., 0.015 for 1.5%).
   *
   * @param decimal - The decimal value from the backend
   */
  function formatPercent(decimal: number): string {
    return percentFormatter.format(decimal)
  }

  /**
   * Formats a date for display in Brazilian format.
   */
  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('pt-BR')
  }

  /**
   * Formats a date with time for display in Brazilian format.
   */
  function formatDateTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleString('pt-BR')
  }

  return {
    formatCurrency,
    formatPercent,
    formatDate,
    formatDateTime
  }
}
