/**
 * Dashboard API composable.
 * Fetches the financial dashboard summary from the backend.
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - No financial calculations performed here
 */

interface DashboardApiResponse {
  total_balance_cents: number
  yield_this_month_cents: number
  reference_month: string
}

export interface Dashboard {
  totalBalanceCents: number
  yieldThisMonthCents: number
  referenceMonth: string
}

export function useDashboardApi() {
  const api = useApi()

  const dashboard = ref<Dashboard | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchDashboard(): Promise<void> {
    isLoading.value = true
    error.value = null

    const response = await api.get<DashboardApiResponse>('/v1/finances/dashboard')

    if (response.error) {
      error.value = response.error.message
    } else if (response.data) {
      dashboard.value = {
        totalBalanceCents: response.data.total_balance_cents,
        yieldThisMonthCents: response.data.yield_this_month_cents,
        referenceMonth: response.data.reference_month
      }
    }

    isLoading.value = false
  }

  return {
    dashboard,
    isLoading,
    error,
    fetchDashboard
  }
}
