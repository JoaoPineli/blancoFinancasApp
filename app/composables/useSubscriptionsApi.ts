/**
 * Subscriptions API composable.
 * Handles all subscription-related API interactions for client plan subscriptions.
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - No financial calculations performed here
 * - All cost data comes from the backend
 */

/**
 * API response types matching backend schemas.
 */
export interface SubscriptionApiResponse {
  id: string
  user_id: string
  plan_id: string
  plan_title: string
  target_amount_cents: number
  deposit_count: number
  monthly_amount_cents: number
  admin_tax_value_cents: number
  insurance_percent: number
  guarantee_fund_percent: number
  total_cost_cents: number
  status: string
  created_at: string
}

export interface SubscriptionListApiResponse {
  subscriptions: SubscriptionApiResponse[]
  total: number
}

export interface RecommendationApiResponse {
  plan_id: string
  plan_title: string
  deposit_count: number
  monthly_amount_cents: number
  total_cost_cents: number
  admin_tax_value_cents: number
  insurance_cost_cents: number
  guarantee_fund_cost_cents: number
  guarantee_fund_percent: number
  min_duration_months: number
  max_duration_months: number | null
  min_value_cents: number
  max_value_cents: number | null
}

export interface CostApiResponse {
  total_cost_cents: number
  admin_tax_value_cents: number
  insurance_cost_cents: number
  guarantee_fund_cost_cents: number
  guarantee_fund_percent: number
  monthly_amount_cents: number
  deposit_count: number
}

/**
 * Frontend-friendly subscription shape.
 * Simple mapping from API response, no calculations.
 */
export interface Subscription {
  id: string
  userId: string
  planId: string
  planTitle: string
  targetAmountCents: number
  depositCount: number
  monthlyAmountCents: number
  adminTaxValueCents: number
  insurancePercent: number
  guaranteeFundPercent: number
  totalCostCents: number
  status: string
  createdAt: string
}

function toSubscription(response: SubscriptionApiResponse): Subscription {
  return {
    id: response.id,
    userId: response.user_id,
    planId: response.plan_id,
    planTitle: response.plan_title,
    targetAmountCents: response.target_amount_cents,
    depositCount: response.deposit_count,
    monthlyAmountCents: response.monthly_amount_cents,
    adminTaxValueCents: response.admin_tax_value_cents,
    insurancePercent: Number(response.insurance_percent),
    guaranteeFundPercent: Number(response.guarantee_fund_percent),
    totalCostCents: response.total_cost_cents,
    status: response.status,
    createdAt: response.created_at
  }
}

export function useSubscriptionsApi() {
  const api = useApi()
  const toast = useToast()

  // Reactive state
  const subscriptions = ref<Subscription[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches all subscriptions for the current authenticated user.
   */
  async function fetchSubscriptions(): Promise<void> {
    isLoading.value = true
    error.value = null

    const response = await api.get<SubscriptionListApiResponse>('/v1/subscriptions')

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar assinaturas',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      subscriptions.value = response.data.subscriptions.map(toSubscription)
    }

    isLoading.value = false
  }

  /**
   * Gets a plan recommendation from the backend.
   * All cost calculations are done server-side.
   */
  async function getRecommendation(
    targetAmountCents: number,
    preference: 'FEWER_PAYMENTS' | 'LOWER_MONTHLY_AMOUNT'
  ): Promise<RecommendationApiResponse | null> {
    const response = await api.post<RecommendationApiResponse>(
      '/v1/subscriptions/recommend',
      {
        target_amount_cents: targetAmountCents,
        preference
      }
    )

    if (response.error) {
      toast.add({
        title: 'Erro na recomendação',
        description: response.error.message,
        color: 'error'
      })
      return null
    }

    return response.data
  }

  /**
   * Calculates cost breakdown for specific parameters.
   * Called when user adjusts deposit_count or monthly_amount.
   * Per guardrails: financial calculations MUST stay on the backend.
   */
  async function calculateCost(
    planId: string,
    targetAmountCents: number,
    depositCount: number,
    monthlyAmountCents: number
  ): Promise<CostApiResponse | null> {
    const response = await api.post<CostApiResponse>(
      '/v1/subscriptions/calculate-cost',
      {
        plan_id: planId,
        target_amount_cents: targetAmountCents,
        deposit_count: depositCount,
        monthly_amount_cents: monthlyAmountCents
      }
    )

    if (response.error) {
      // Don't show toast for validation errors during adjustment
      return null
    }

    return response.data
  }

  /**
   * Creates a new subscription.
   */
  async function createSubscription(
    planId: string,
    targetAmountCents: number,
    depositCount: number,
    monthlyAmountCents: number
  ): Promise<Subscription | null> {
    const response = await api.post<SubscriptionApiResponse>(
      '/v1/subscriptions',
      {
        plan_id: planId,
        target_amount_cents: targetAmountCents,
        deposit_count: depositCount,
        monthly_amount_cents: monthlyAmountCents
      }
    )

    if (response.error) {
      toast.add({
        title: 'Erro ao criar assinatura',
        description: response.error.message,
        color: 'error'
      })
      return null
    }

    if (response.data) {
      const subscription = toSubscription(response.data)
      // Add to local state
      subscriptions.value.unshift(subscription)
      return subscription
    }

    return null
  }

  return {
    subscriptions,
    isLoading,
    error,
    fetchSubscriptions,
    getRecommendation,
    calculateCost,
    createSubscription
  }
}
