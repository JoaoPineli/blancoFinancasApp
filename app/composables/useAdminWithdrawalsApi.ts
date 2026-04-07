/**
 * Admin withdrawals API composable.
 * Handles withdrawal listing, approval, and rejection for the admin panel.
 *
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - Components receive data via props — no API calls inside components
 */

// ------------------------------------------------------------------
// API response types
// ------------------------------------------------------------------

export interface AdminWithdrawalApiResponse {
  id: string
  user_id: string
  user_name: string
  owner_name: string | null
  pix_key: string | null
  pix_key_type: string | null
  amount_cents: number
  status: string
  rejection_reason: string | null
  description: string | null
  created_at: string
  confirmed_at: string | null
}

export interface AdminWithdrawalListApiResponse {
  withdrawals: AdminWithdrawalApiResponse[]
  total: number
}

// ------------------------------------------------------------------
// Frontend-friendly type (camelCase)
// ------------------------------------------------------------------

export interface AdminWithdrawal {
  id: string
  userId: string
  userName: string
  ownerName: string | null
  pixKey: string | null
  pixKeyType: string | null
  amountCents: number
  status: string
  rejectionReason: string | null
  description: string | null
  createdAt: string
  confirmedAt: string | null
}

// ------------------------------------------------------------------
// Mapper
// ------------------------------------------------------------------

function toAdminWithdrawal(r: AdminWithdrawalApiResponse): AdminWithdrawal {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    ownerName: r.owner_name,
    pixKey: r.pix_key,
    pixKeyType: r.pix_key_type,
    amountCents: r.amount_cents,
    status: r.status,
    rejectionReason: r.rejection_reason,
    description: r.description,
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at
  }
}

// ------------------------------------------------------------------
// Composable
// ------------------------------------------------------------------

export function useAdminWithdrawalsApi() {
  const api = useApi()
  const toast = useToast()

  const withdrawals = ref<AdminWithdrawal[]>([])
  const isLoading = ref(false)
  const isActioning = ref(false)

  async function fetchWithdrawals(statusFilter?: string): Promise<void> {
    isLoading.value = true

    const params: Record<string, string> = {}
    if (statusFilter) params.status_filter = statusFilter

    const response = await api.get<AdminWithdrawalListApiResponse>(
      '/v1/admin/withdrawals',
      params
    )

    if (response.error && !response.error.handled) {
      toast.add({
        title: 'Erro ao carregar saques',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      withdrawals.value = response.data.withdrawals.map(toAdminWithdrawal)
    }

    isLoading.value = false
  }

  async function approveWithdrawal(transactionId: string): Promise<boolean> {
    isActioning.value = true

    const response = await api.post('/v1/admin/withdrawals/approve', {
      transaction_id: transactionId
    })

    if (response.error && !response.error.handled) {
      toast.add({
        title: 'Erro ao confirmar saque',
        description: response.error.message,
        color: 'error'
      })
      isActioning.value = false
      return false
    }

    toast.add({
      title: 'Saque confirmado',
      description: 'O cliente será notificado.',
      color: 'success'
    })
    isActioning.value = false
    return true
  }

  async function rejectWithdrawal(transactionId: string, reason: string): Promise<boolean> {
    isActioning.value = true

    const response = await api.post('/v1/admin/withdrawals/reject', {
      transaction_id: transactionId,
      reason
    })

    if (response.error && !response.error.handled) {
      toast.add({
        title: 'Erro ao recusar saque',
        description: response.error.message,
        color: 'error'
      })
      isActioning.value = false
      return false
    }

    toast.add({
      title: 'Saque recusado',
      description: 'A solicitação foi recusada e o plano do cliente foi reativado.',
      color: 'info'
    })
    isActioning.value = false
    return true
  }

  return {
    withdrawals,
    isLoading,
    isActioning,
    fetchWithdrawals,
    approveWithdrawal,
    rejectWithdrawal
  }
}
