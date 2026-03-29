/**
 * Admin reports API composable.
 * Handles binary file downloads for all admin report types.
 *
 * Per guardrails:
 * - All HTTP interactions use fetch with Authorization header (binary downloads).
 * - Exposes per-button loading states so only the clicked button is blocked.
 * - No business logic — just transport and filename resolution.
 */

// Report ID → backend endpoint path
const REPORT_ENDPOINTS: Record<string, string> = {
  clients: '/v1/admin/reports/clients',
  transactions: '/v1/admin/reports/transactions',
  cashflow: '/v1/admin/reports/cash-flow',
  yields: '/v1/admin/reports/yields'
}

// Report ID → fallback filename prefix
const REPORT_NAME_PREFIX: Record<string, string> = {
  clients: 'clientes',
  transactions: 'transacoes',
  cashflow: 'fluxo_caixa',
  yields: 'rendimentos'
}

export function useAdminReportsApi() {
  const config = useRuntimeConfig()
  const token = useCookie<string | null>('auth_token')
  const toast = useToast()

  /**
   * Per-button loading state.
   * Key format: `${reportId}_${format.toLowerCase()}`  e.g. "cashflow_xlsx"
   */
  const loadingStates = ref<Record<string, boolean>>({})

  function isLoading(reportId: string, format: string): boolean {
    return loadingStates.value[`${reportId}_${format.toLowerCase()}`] ?? false
  }

  /**
   * Download a report as a binary file.
   *
   * @param reportId   - One of: clients | transactions | cashflow | yields
   * @param format     - Display format label: Excel | CSV | PDF
   * @param startDate  - YYYY-MM-DD
   * @param endDate    - YYYY-MM-DD
   */
  async function downloadReport(
    reportId: string,
    format: string,
    startDate: string,
    endDate: string
  ): Promise<void> {
    const formatLower = format.toLowerCase()
    const apiFormat = formatLower === 'excel' ? 'xlsx' : formatLower
    const key = `${reportId}_${formatLower}`

    loadingStates.value[key] = true

    try {
      const endpoint = REPORT_ENDPOINTS[reportId]
      if (!endpoint) throw new Error(`Relatório desconhecido: ${reportId}`)

      const baseUrl = config.public.apiBaseUrl as string
      const params = new URLSearchParams({
        start_date: startDate,
        end_date: endDate,
        format: apiFormat
      })
      const url = `${baseUrl}${endpoint}?${params}`

      const res = await fetch(url, {
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      // Prefer filename from Content-Disposition header
      const disposition = res.headers.get('content-disposition') ?? ''
      let filename = ''
      const match = disposition.match(/filename=["']?([^"';\r\n]+)["']?/)
      if (match?.[1]) {
        filename = match[1].trim()
      } else {
        const prefix = REPORT_NAME_PREFIX[reportId] ?? reportId
        filename = `${prefix}_${startDate}_${endDate}.${apiFormat}`
      }

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = objectUrl
      a.download = filename
      a.click()
      URL.revokeObjectURL(objectUrl)
    } catch {
      toast.add({
        title: 'Erro ao baixar relatório',
        description: 'Não foi possível gerar o arquivo. Tente novamente.',
        color: 'error'
      })
    } finally {
      loadingStates.value[key] = false
    }
  }

  return {
    loadingStates,
    isLoading,
    downloadReport
  }
}
