/**
 * Plans API composable.
 * Handles all plan-related API interactions for admin plan management.
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - No financial calculations performed here
 * - Data comes from backend as the single source of truth
 */

import type { AdminPlan } from './useMockData'

/**
 * API response types matching backend schemas
 * null values for max_value_cents and max_duration_months mean indefinite (no limit)
 */
export interface PlanApiResponse {
  id: string
  title: string
  description: string
  min_value_cents: number
  max_value_cents: number | null
  min_duration_months: number
  max_duration_months: number | null
  admin_tax_value_cents: number
  insurance_percent: number
  guarantee_fund_percent_1: number
  guarantee_fund_percent_2: number
  guarantee_fund_threshold_cents: number
  active: boolean
}

export interface PlanListApiResponse {
  plans: PlanApiResponse[]
  total: number
}

export interface PlanSummary {
  id: string
  title: string
  status: 'active' | 'inactive'
}

export interface CreatePlanRequest {
  title: string
  description: string
  min_value_cents: number
  max_value_cents: number | null
  min_duration_months: number
  max_duration_months: number | null
  admin_tax_value_cents: number
  insurance_percent: number
  guarantee_fund_percent_1: number
  guarantee_fund_percent_2: number
  guarantee_fund_threshold_cents: number
  active: boolean
}

// UpdatePlanRequest uses the same structure as CreatePlanRequest
export type UpdatePlanRequest = CreatePlanRequest

/**
 * Transforms API response to frontend AdminPlan format.
 * This is a simple mapping, no calculations.
 */
function toAdminPlan(response: PlanApiResponse): AdminPlan {
  return {
    id: response.id,
    title: response.title,
    description: response.description,
    minValueCents: response.min_value_cents,
    maxValueCents: response.max_value_cents,
    minDurationMonths: response.min_duration_months,
    maxDurationMonths: response.max_duration_months,
    adminTaxValueCents: response.admin_tax_value_cents,
    insurancePercent: Number(response.insurance_percent),
    guaranteeFundPercent1: Number(response.guarantee_fund_percent_1),
    guaranteeFundPercent2: Number(response.guarantee_fund_percent_2),
    guaranteeFundThresholdCents: response.guarantee_fund_threshold_cents,
    active: response.active
  }
}

/**
 * Transforms frontend form data to API request format.
 */
function toApiRequest(data: {
  title: string
  description: string
  minValueCents: number
  maxValueCents: number | null
  minDurationMonths: number
  maxDurationMonths: number | null
  adminTaxValueCents: number
  insurancePercent: number
  guaranteeFundPercent1: number
  guaranteeFundPercent2: number
  guaranteeFundThresholdCents: number
  active: boolean
}): CreatePlanRequest {
  return {
    title: data.title,
    description: data.description,
    min_value_cents: data.minValueCents,
    max_value_cents: data.maxValueCents,
    min_duration_months: data.minDurationMonths,
    max_duration_months: data.maxDurationMonths,
    admin_tax_value_cents: data.adminTaxValueCents,
    insurance_percent: data.insurancePercent,
    guarantee_fund_percent_1: data.guaranteeFundPercent1,
    guarantee_fund_percent_2: data.guaranteeFundPercent2,
    guarantee_fund_threshold_cents: data.guaranteeFundThresholdCents,
    active: data.active
  }
}

export function usePlansApi() {
  const api = useApi()
  const toast = useToast()

  // Reactive state
  const plans = ref<AdminPlan[]>([])
  const searchQuery = ref('')
  const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)
  const isSearching = ref(false)
  const planSummaries = ref<PlanSummary[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetches all plans from the backend.
   * Supports optional title search.
   */
  async function fetchPlans(search?: string): Promise<void> {
    isLoading.value = true
    error.value = null

    const query: Record<string, string | undefined> = {}
    if (search?.trim()) {
      query.search = search.trim()
    }

    const response = await api.get<PlanListApiResponse>('/v1/admin/plans', query)

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar planos',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      plans.value = response.data.plans.map(toAdminPlan)
    }

    isLoading.value = false
  }

  /**
   * Debounced search that coalesces rapid input changes.
   * Centralizes search policy to prevent page-level implementation.
   */
  function debouncedSearch(query: string, delayMs = 300): void {
    searchQuery.value = query

    if (searchTimeout.value) {
      clearTimeout(searchTimeout.value)
    }

    searchTimeout.value = setTimeout(async () => {
      isSearching.value = true
      await fetchPlans(query)
      isSearching.value = false
    }, delayMs)
  }

  /**
   * Fetches plan summaries (id, title, status) for lightweight selectors.
   */
  async function fetchPlanSummaries(): Promise<void> {
    isLoading.value = true
    error.value = null

    const response = await api.get<PlanSummary[]>('/v1/admin/plans/summary')

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar planos',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      planSummaries.value = response.data
    }

    isLoading.value = false
  }

  /**
   * Creates a new plan.
   */
  async function createPlan(data: {
    title: string
    description: string
    minValueCents: number
    maxValueCents: number | null
    minDurationMonths: number
    maxDurationMonths: number | null
    adminTaxValueCents: number
    insurancePercent: number
    guaranteeFundPercent1: number
    guaranteeFundPercent2: number
    guaranteeFundThresholdCents: number
    active: boolean
  }): Promise<AdminPlan | null> {
    isLoading.value = true
    error.value = null

    const requestBody = toApiRequest(data)
    const response = await api.post<PlanApiResponse>('/v1/admin/plans', requestBody as unknown as Record<string, unknown>)

    isLoading.value = false

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao criar plano',
        description: response.error.message,
        color: 'error'
      })
      return null
    }

    if (response.data) {
      const newPlan = toAdminPlan(response.data)
      // Add to local state
      plans.value = [newPlan, ...plans.value]
      toast.add({
        title: 'Plano criado',
        description: `Plano "${newPlan.title}" foi criado com sucesso.`,
        color: 'success'
      })
      return newPlan
    }

    return null
  }

  /**
   * Updates an existing plan.
   */
  async function updatePlan(
    planId: string,
    data: {
      title: string
      description: string
      minValueCents: number
      maxValueCents: number | null
      minDurationMonths: number
      maxDurationMonths: number | null
      adminTaxValueCents: number
      insurancePercent: number
      guaranteeFundPercent1: number
      guaranteeFundPercent2: number
      guaranteeFundThresholdCents: number
      active: boolean
    }
  ): Promise<AdminPlan | null> {
    isLoading.value = true
    error.value = null

    const requestBody = toApiRequest(data)
    const response = await api.put<PlanApiResponse>(
      `/v1/admin/plans/${planId}`,
      requestBody as unknown as Record<string, unknown>
    )

    isLoading.value = false

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao atualizar plano',
        description: response.error.message,
        color: 'error'
      })
      return null
    }

    if (response.data) {
      const updatedPlan = toAdminPlan(response.data)
      // Update local state
      plans.value = plans.value.map(p =>
        p.id === planId ? updatedPlan : p
      )
      toast.add({
        title: 'Plano atualizado',
        description: `Plano "${updatedPlan.title}" foi atualizado com sucesso.`,
        color: 'success'
      })
      return updatedPlan
    }

    return null
  }

  /**
   * Deletes a plan (soft delete).
   */
  async function deletePlan(planId: string): Promise<boolean> {
    isLoading.value = true
    error.value = null

    const response = await api.delete(`/v1/admin/plans/${planId}`)

    isLoading.value = false

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao deletar plano',
        description: response.error.message,
        color: 'error'
      })
      return false
    }

    // Remove from local state
    const deletedPlan = plans.value.find(p => p.id === planId)
    plans.value = plans.value.filter(p => p.id !== planId)

    toast.add({
      title: 'Plano deletado',
      description: deletedPlan ? `Plano "${deletedPlan.title}" foi deletado com sucesso.` : 'Plano deletado com sucesso.',
      color: 'success'
    })

    return true
  }

  /**
   * Toggles the active status of a plan.
   * Preserves all other plan fields, only updates `active`.
   */
  async function togglePlanStatus(planId: string, active: boolean): Promise<AdminPlan | null> {
    const existingPlan = plans.value.find(p => p.id === planId)
    if (!existingPlan) {
      error.value = 'Plano não encontrado'
      toast.add({
        title: 'Erro ao atualizar status',
        description: 'Plano não encontrado no estado local.',
        color: 'error'
      })
      return null
    }

    isLoading.value = true
    error.value = null

    const requestBody = toApiRequest({
      ...existingPlan,
      active
    })
    const response = await api.put<PlanApiResponse>(
      `/v1/admin/plans/${planId}`,
      requestBody as unknown as Record<string, unknown>
    )

    isLoading.value = false

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao atualizar status',
        description: response.error.message,
        color: 'error'
      })
      return null
    }

    if (response.data) {
      const updatedPlan = toAdminPlan(response.data)
      plans.value = plans.value.map(p =>
        p.id === planId ? updatedPlan : p
      )
      toast.add({
        title: active ? 'Plano ativado' : 'Plano inativado',
        description: `Plano "${updatedPlan.title}" foi ${active ? 'ativado' : 'inativado'} com sucesso.`,
        color: 'success'
      })
      return updatedPlan
    }

    return null
  }

  /**
   * Returns plans sorted by status (active first) then by title.
   */
  const sortedPlans = computed(() => {
    return [...plans.value].sort((a, b) => {
      if (a.active !== b.active) {
        return a.active ? -1 : 1
      }
      return a.title.localeCompare(b.title)
    })
  })

  return {
    // State
    plans: readonly(plans),
    sortedPlans,
    planSummaries: readonly(planSummaries),
    isLoading: readonly(isLoading),
    isSearching: readonly(isSearching),
    searchQuery: readonly(searchQuery),
    error: readonly(error),

    // Actions
    fetchPlans,
    debouncedSearch,
    fetchPlanSummaries,
    createPlan,
    updatePlan,
    deletePlan,
    togglePlanStatus
  }
}
