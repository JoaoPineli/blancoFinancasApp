/**
 * Admin finance API composable.
 * Handles summary, cash flow, and reconciliation data for the admin finance page.
 *
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - Components receive data via props — no API calls inside components
 * - No financial calculations on the frontend
 */

// ------------------------------------------------------------------
// API response types (snake_case)
// ------------------------------------------------------------------

interface AdminFinanceSummaryApiResponse {
  fundo_garantidor_cents: number
  total_inflow_cents: number
  total_outflow_cents: number
  net_balance_cents: number
  period_start: string
  period_end: string
}

interface AdminCashFlowEntryApiResponse {
  id: string
  date: string
  description: string
  type: 'inflow' | 'outflow'
  amount_cents: number
  category: string
}

interface AdminCashFlowListApiResponse {
  entries: AdminCashFlowEntryApiResponse[]
  total: number
  page: number
  page_size: number
}

interface AdminReconciliationSummaryApiResponse {
  conciliado: number
  pendente: number
  divergente: number
  total: number
}

// ------------------------------------------------------------------
// Frontend-friendly types (camelCase)
// ------------------------------------------------------------------

export interface AdminFinanceSummary {
  fundoGarantidorCents: number
  totalInflowCents: number
  totalOutflowCents: number
  netBalanceCents: number
  periodStart: string
  periodEnd: string
}

export interface AdminCashFlowEntry {
  id: string
  date: string
  description: string
  type: 'inflow' | 'outflow'
  amountCents: number
  category: string
}

export interface AdminReconciliationSummary {
  conciliado: number
  pendente: number
  divergente: number
  total: number
}

// ------------------------------------------------------------------
// Mappers
// ------------------------------------------------------------------

function toFinanceSummary(r: AdminFinanceSummaryApiResponse): AdminFinanceSummary {
  return {
    fundoGarantidorCents: r.fundo_garantidor_cents,
    totalInflowCents: r.total_inflow_cents,
    totalOutflowCents: r.total_outflow_cents,
    netBalanceCents: r.net_balance_cents,
    periodStart: r.period_start,
    periodEnd: r.period_end
  }
}

function toCashFlowEntry(r: AdminCashFlowEntryApiResponse): AdminCashFlowEntry {
  return {
    id: r.id,
    date: r.date,
    description: r.description,
    type: r.type,
    amountCents: r.amount_cents,
    category: r.category
  }
}

// ------------------------------------------------------------------
// Composable
// ------------------------------------------------------------------

export function useAdminFinanceApi() {
  const api = useApi()
  const config = useRuntimeConfig()
  const toast = useToast()
  const token = useCookie<string | null>('auth_token')

  const summary = ref<AdminFinanceSummary | null>(null)
  const cashFlow = ref<AdminCashFlowEntry[]>([])
  const cashFlowTotal = ref(0)
  const reconciliation = ref<AdminReconciliationSummary | null>(null)

  const isLoadingSummary = ref(false)
  const isLoadingCashFlow = ref(false)
  const isLoadingReconciliation = ref(false)
  const isDownloading = ref(false)

  const summaryError = ref<string | null>(null)
  const cashFlowError = ref<string | null>(null)

  async function fetchSummary(
    startDate: string,
    endDate: string,
    category?: string,
    flowType?: string
  ): Promise<void> {
    isLoadingSummary.value = true
    summaryError.value = null

    const params: Record<string, string | number> = { start_date: startDate, end_date: endDate }
    if (category) params.category = category
    if (flowType) params.flow_type = flowType

    const response = await api.get<AdminFinanceSummaryApiResponse>(
      '/v1/admin/finance/summary',
      params
    )

    if (response.error) {
      summaryError.value = response.error.message
      toast.add({
        title: 'Erro ao carregar resumo financeiro',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      summary.value = toFinanceSummary(response.data)
    }

    isLoadingSummary.value = false
  }

  async function fetchCashFlow(
    startDate: string,
    endDate: string,
    page = 1,
    pageSize = 50,
    category?: string,
    flowType?: string
  ): Promise<void> {
    isLoadingCashFlow.value = true
    cashFlowError.value = null

    const params: Record<string, string | number> = {
      start_date: startDate,
      end_date: endDate,
      page,
      page_size: pageSize
    }
    if (category) params.category = category
    if (flowType) params.flow_type = flowType

    const response = await api.get<AdminCashFlowListApiResponse>(
      '/v1/admin/finance/cash-flow',
      params
    )

    if (response.error) {
      cashFlowError.value = response.error.message
      toast.add({
        title: 'Erro ao carregar fluxo de caixa',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      cashFlow.value = response.data.entries.map(toCashFlowEntry)
      cashFlowTotal.value = response.data.total
    }

    isLoadingCashFlow.value = false
  }

  async function fetchReconciliation(): Promise<void> {
    isLoadingReconciliation.value = true

    const response = await api.get<AdminReconciliationSummaryApiResponse>(
      '/v1/admin/finance/reconciliation/summary'
    )

    if (response.error) {
      toast.add({
        title: 'Erro ao carregar conciliação',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      reconciliation.value = response.data
    }

    isLoadingReconciliation.value = false
  }

  async function downloadCashFlowReport(startDate: string, endDate: string): Promise<void> {
    isDownloading.value = true

    try {
      const baseUrl = config.public.apiBaseUrl as string
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
      const url = `${baseUrl}/v1/admin/reports/cash-flow?${params}`

      const res = await fetch(url, {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = `fluxo_caixa_${startDate}_${endDate}.xlsx`
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.add({
        title: 'Erro ao baixar relatório',
        description: 'Não foi possível gerar o arquivo. Tente novamente.',
        color: 'error'
      })
    } finally {
      isDownloading.value = false
    }
  }

  return {
    summary,
    cashFlow,
    cashFlowTotal,
    reconciliation,
    isLoadingSummary,
    isLoadingCashFlow,
    isLoadingReconciliation,
    isDownloading,
    summaryError,
    cashFlowError,
    fetchSummary,
    fetchCashFlow,
    fetchReconciliation,
    downloadCashFlowReport
  }
}
