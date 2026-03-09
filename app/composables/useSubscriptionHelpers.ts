/**
 * Subscription display helpers composable.
 * Contains presentation logic for subscription cards: status labels/colors,
 * sorting, fee context, and relative date computations.
 *
 * Per guardrails:
 * - No financial calculations (yields, interest, balances).
 * - Fee percentage is a display ratio, not a financial calculation.
 * - All monetary values come from the backend.
 */

import type { Subscription } from './useSubscriptionsApi'

/**
 * Fee attention threshold: fees above this percentage of the target
 * receive warning styling. Configurable constant per requirement.
 */
export const FEE_ATTENTION_THRESHOLD_PERCENT = 0.03

export type SortOption = 'next-due' | 'highest-target' | 'highest-monthly'
export type ViewMode = 'detailed' | 'compact'

export const SORT_OPTIONS: { label: string, value: SortOption }[] = [
  { label: 'Próximo vencimento', value: 'next-due' },
  { label: 'Maior objetivo', value: 'highest-target' },
  { label: 'Maior parcela', value: 'highest-monthly' }
]

export function useSubscriptionHelpers() {
  /**
   * Human-readable status label.
   */
  function statusLabel(status: string): string {
    const labels: Record<string, string> = {
      active: 'Ativa',
      paused: 'Pausada',
      completed: 'Concluída',
      cancelled: 'Cancelada'
    }
    return labels[status] || status
  }

  /**
   * Badge color for subscription status.
   */
  function statusColor(status: string): 'success' | 'warning' | 'neutral' | 'error' {
    const colors: Record<string, 'success' | 'warning' | 'neutral' | 'error'> = {
      active: 'success',
      paused: 'warning',
      completed: 'neutral',
      cancelled: 'error'
    }
    return colors[status] || 'neutral'
  }

  /**
   * ARIA label for status badge (accessibility).
   */
  function statusAriaLabel(status: string): string {
    return `Status: ${statusLabel(status)}`
  }

  /**
   * Compute calendar days between today and a date string.
   * Returns positive for future dates, negative for past, 0 for today.
   * Returns null for invalid/missing date strings.
   */
  function daysUntil(dateStr: string | null | undefined): number | null {
    if (!dateStr) return null
    const target = new Date(dateStr + 'T00:00:00')
    if (isNaN(target.getTime())) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const diffMs = target.getTime() - today.getTime()
    return Math.round(diffMs / (1000 * 60 * 60 * 24))
  }

  /**
   * Human-readable label for days until a date.
   * Examples: "Hoje", "Amanhã", "em 5 dias", "há 2 dias".
   */
  function daysUntilLabel(dateStr: string | null | undefined): string {
    const days = daysUntil(dateStr)
    if (days === null) return ''
    if (days === 0) return 'Hoje'
    if (days === 1) return 'Amanhã'
    if (days > 1) return `em ${days} dias`
    if (days === -1) return 'há 1 dia'
    return `há ${Math.abs(days)} dias`
  }

  /**
   * Compute fee as a ratio of target amount. Returns decimal (e.g., 0.025 = 2.5%).
   * Returns null if target is zero or values are invalid.
   * NOTE: This is a display ratio, not a financial calculation.
   */
  function feePercentOfTarget(totalCostCents: number, targetAmountCents: number): number | null {
    if (!targetAmountCents || targetAmountCents <= 0) return null
    if (totalCostCents == null) return null
    return totalCostCents / targetAmountCents
  }

  /**
   * Whether the fee ratio exceeds the attention threshold.
   */
  function isFeeHighlighted(totalCostCents: number, targetAmountCents: number): boolean {
    const pct = feePercentOfTarget(totalCostCents, targetAmountCents)
    return pct !== null && pct > FEE_ATTENTION_THRESHOLD_PERCENT
  }

  /**
   * Safely parse a date string for sorting. Returns Infinity for invalid dates
   * so they sort to the end.
   */
  function safeDateTimestamp(dateStr: string | null | undefined): number {
    if (!dateStr) return Infinity
    const ts = new Date(dateStr + 'T00:00:00').getTime()
    return isNaN(ts) ? Infinity : ts
  }

  /**
   * Sort subscriptions by the given option.
   * Returns a new sorted array (does not mutate the input).
   * Stable sort with safe fallback for invalid dates.
   */
  function sortSubscriptions(subs: Subscription[], sortBy: SortOption): Subscription[] {
    const copy = [...subs]

    switch (sortBy) {
      case 'next-due':
        return copy.sort((a, b) =>
          safeDateTimestamp(a.nextDueDate) - safeDateTimestamp(b.nextDueDate)
        )
      case 'highest-target':
        return copy.sort((a, b) =>
          (b.targetAmountCents ?? 0) - (a.targetAmountCents ?? 0)
        )
      case 'highest-monthly':
        return copy.sort((a, b) =>
          (b.monthlyAmountCents ?? 0) - (a.monthlyAmountCents ?? 0)
        )
      default:
        return copy
    }
  }

  return {
    statusLabel,
    statusColor,
    statusAriaLabel,
    daysUntil,
    daysUntilLabel,
    feePercentOfTarget,
    isFeeHighlighted,
    sortSubscriptions
  }
}
