/**
 * Admin clients API composable.
 * Provides paginated client list with search, filtering and real stats.
 *
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - No financial calculations performed here
 */

// ------------------------------------------------------------------
// API response types
// ------------------------------------------------------------------

interface AdminClientApiResponse {
  id: string
  name: string
  email: string
  cpf: string | null
  status: string
  phone: string | null
  created_at: string
  total_invested_cents: number
}

interface AdminClientStatsApiResponse {
  active: number
  inactive: number
  defaulting: number
  registered: number
  total: number
}

interface AdminClientListApiResponse {
  clients: AdminClientApiResponse[]
  total: number
  page: number
  page_size: number
  stats: AdminClientStatsApiResponse
}

// ------------------------------------------------------------------
// Frontend-friendly types
// ------------------------------------------------------------------

export interface AdminClient {
  id: string
  name: string
  email: string
  cpf: string | null
  status: string
  phone: string | null
  createdAt: string
  totalInvestedCents: number
}

export interface AdminClientStats {
  active: number
  inactive: number
  defaulting: number
  registered: number
  total: number
}

export interface FetchClientsParams {
  statusFilter?: string
  q?: string
  page?: number
  pageSize?: number
}

export function useAdminClientsApi() {
  const api = useApi()
  const toast = useToast()

  const clients = ref<AdminClient[]>([])
  const stats = ref<AdminClientStats>({
    active: 0,
    inactive: 0,
    defaulting: 0,
    registered: 0,
    total: 0
  })
  const total = ref(0)
  const page = ref(1)
  const pageSize = ref(20)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchClients(params: FetchClientsParams = {}): Promise<void> {
    isLoading.value = true
    error.value = null

    const qs = new URLSearchParams()
    if (params.statusFilter) qs.set('status_filter', params.statusFilter)
    if (params.q?.trim()) qs.set('q', params.q.trim())
    qs.set('page', String(params.page ?? page.value))
    qs.set('page_size', String(params.pageSize ?? pageSize.value))

    const response = await api.get<AdminClientListApiResponse>(
      `/v1/admin/clients?${qs.toString()}`
    )

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar clientes',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      const d = response.data
      clients.value = d.clients.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        cpf: c.cpf,
        status: c.status,
        phone: c.phone,
        createdAt: c.created_at,
        totalInvestedCents: c.total_invested_cents
      }))
      stats.value = {
        active: d.stats.active,
        inactive: d.stats.inactive,
        defaulting: d.stats.defaulting,
        registered: d.stats.registered,
        total: d.stats.total
      }
      total.value = d.total
      page.value = d.page
      pageSize.value = d.page_size
    }

    isLoading.value = false
  }

  async function changeClientStatus(userId: string, newStatus: string): Promise<boolean> {
    const response = await api.patch(`/v1/admin/users/${userId}/status`, {
      status: newStatus
    })

    if (response.error) {
      toast.add({
        title: 'Erro ao alterar status',
        description: response.error.message,
        color: 'error'
      })
      return false
    }

    toast.add({
      title: 'Status alterado',
      color: 'success'
    })
    return true
  }

  return {
    clients,
    stats,
    total,
    page,
    pageSize,
    isLoading,
    error,
    fetchClients,
    changeClientStatus
  }
}
