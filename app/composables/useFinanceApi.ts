/**
 * Finance API composable.
 * Handles all finance-related API interactions for the Finance page:
 * - Payable installments listing
 * - Installment payment creation and retrieval
 * - Withdrawable subscriptions listing
 * - Plan withdrawal requests
 * - Financial history
 *
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - No financial calculations performed here
 * - All monetary values and totals come from the backend
 */

// ------------------------------------------------------------------
// API response types (match backend schemas exactly)
// ------------------------------------------------------------------

export interface PayableInstallmentApiResponse {
  subscription_id: string
  subscription_name: string
  plan_title: string
  installment_number: number
  total_installments: number
  amount_cents: number
  due_date: string
  is_overdue: boolean
  status: string
  pending_payment_id: string | null
}

export interface PayableInstallmentsListApiResponse {
  installments: PayableInstallmentApiResponse[]
  total: number
}

export interface InstallmentPaymentItemApiResponse {
  id: string
  subscription_id: string
  subscription_name: string
  plan_title: string
  amount_cents: number
  installment_number: number
}

export interface InstallmentPaymentApiResponse {
  id: string
  user_id: string
  status: string
  total_amount_cents: number
  pix_qr_code_data: string | null
  pix_transaction_id: string | null
  expiration_minutes: number
  items: InstallmentPaymentItemApiResponse[]
  created_at: string
  updated_at: string
  confirmed_at: string | null
}

export interface WithdrawableSubscriptionApiResponse {
  subscription_id: string
  subscription_name: string
  plan_title: string
  status: string
  is_early_termination: boolean
  withdrawable_amount_cents: number
  deposits_paid: number
  deposit_count: number
  created_at: string
}

export interface WithdrawableSubscriptionsListApiResponse {
  subscriptions: WithdrawableSubscriptionApiResponse[]
  total: number
}

export interface PlanWithdrawalApiResponse {
  subscription_id: string
  subscription_name: string
  plan_title: string
  status: string
  amount_cents: number
  is_early_termination: boolean
  created_at: string
}

export interface HistoryEventApiResponse {
  id: string
  event_type: string
  status: string
  amount_cents: number
  description: string
  plan_titles: string[]
  subscription_ids: string[]
  created_at: string
  confirmed_at: string | null
  rejection_reason: string | null
}

export interface HistoryListApiResponse {
  events: HistoryEventApiResponse[]
  total: number
}

// ------------------------------------------------------------------
// Frontend-friendly types (camelCase)
// ------------------------------------------------------------------

export interface PayableInstallment {
  subscriptionId: string
  subscriptionName: string
  planTitle: string
  installmentNumber: number
  totalInstallments: number
  amountCents: number
  dueDate: string
  isOverdue: boolean
  status: 'overdue' | 'due_today' | 'upcoming'
  pendingPaymentId: string | null
}

export interface InstallmentPaymentItem {
  id: string
  subscriptionId: string
  subscriptionName: string
  planTitle: string
  amountCents: number
  installmentNumber: number
}

export interface InstallmentPayment {
  id: string
  userId: string
  status: string
  totalAmountCents: number
  pixQrCodeData: string | null
  pixTransactionId: string | null
  expirationMinutes: number
  items: InstallmentPaymentItem[]
  createdAt: string
  updatedAt: string
  confirmedAt: string | null
}

export interface WithdrawableSubscription {
  subscriptionId: string
  subscriptionName: string
  planTitle: string
  status: string
  isEarlyTermination: boolean
  withdrawableAmountCents: number
  depositsPaid: number
  depositCount: number
  createdAt: string
}

export interface PlanWithdrawal {
  subscriptionId: string
  subscriptionName: string
  planTitle: string
  status: string
  amountCents: number
  isEarlyTermination: boolean
  createdAt: string
}

export interface HistoryEvent {
  id: string
  eventType: 'installment_payment' | 'plan_withdrawal'
  status: string
  amountCents: number
  description: string
  planTitles: string[]
  subscriptionIds: string[]
  createdAt: string
  confirmedAt: string | null
  rejectionReason: string | null
}

// ------------------------------------------------------------------
// Mappers (snake_case API → camelCase frontend)
// ------------------------------------------------------------------

function toPayableInstallment(r: PayableInstallmentApiResponse): PayableInstallment {
  return {
    subscriptionId: r.subscription_id,
    subscriptionName: r.subscription_name,
    planTitle: r.plan_title,
    installmentNumber: r.installment_number,
    totalInstallments: r.total_installments,
    amountCents: r.amount_cents,
    dueDate: r.due_date,
    isOverdue: r.is_overdue,
    status: r.status as PayableInstallment['status'],
    pendingPaymentId: r.pending_payment_id
  }
}

function toInstallmentPaymentItem(r: InstallmentPaymentItemApiResponse): InstallmentPaymentItem {
  return {
    id: r.id,
    subscriptionId: r.subscription_id,
    subscriptionName: r.subscription_name,
    planTitle: r.plan_title,
    amountCents: r.amount_cents,
    installmentNumber: r.installment_number
  }
}

function toInstallmentPayment(r: InstallmentPaymentApiResponse): InstallmentPayment {
  return {
    id: r.id,
    userId: r.user_id,
    status: r.status,
    totalAmountCents: r.total_amount_cents,
    pixQrCodeData: r.pix_qr_code_data,
    pixTransactionId: r.pix_transaction_id,
    expirationMinutes: r.expiration_minutes,
    items: r.items.map(toInstallmentPaymentItem),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    confirmedAt: r.confirmed_at
  }
}

function toWithdrawableSubscription(r: WithdrawableSubscriptionApiResponse): WithdrawableSubscription {
  return {
    subscriptionId: r.subscription_id,
    subscriptionName: r.subscription_name,
    planTitle: r.plan_title,
    status: r.status,
    isEarlyTermination: r.is_early_termination,
    withdrawableAmountCents: r.withdrawable_amount_cents,
    depositsPaid: r.deposits_paid,
    depositCount: r.deposit_count,
    createdAt: r.created_at
  }
}

function toHistoryEvent(r: HistoryEventApiResponse): HistoryEvent {
  return {
    id: r.id,
    eventType: r.event_type as HistoryEvent['eventType'],
    status: r.status,
    amountCents: r.amount_cents,
    description: r.description,
    planTitles: r.plan_titles,
    subscriptionIds: r.subscription_ids ?? [],
    createdAt: r.created_at,
    confirmedAt: r.confirmed_at,
    rejectionReason: r.rejection_reason ?? null
  }
}

// ------------------------------------------------------------------
// Composable
// ------------------------------------------------------------------

export function useFinanceApi() {
  const api = useApi()
  const toast = useToast()

  // Reactive state
  const payableInstallments = ref<PayableInstallment[]>([])
  const withdrawableSubscriptions = ref<WithdrawableSubscription[]>([])
  const historyEvents = ref<HistoryEvent[]>([])
  const currentPayment = ref<InstallmentPayment | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // ------------------------------------------------------------------
  // Payable installments
  // ------------------------------------------------------------------

  /**
   * Fetches payable installments for the current user.
   * Returns one installment per active subscription, sorted by urgency.
   */
  async function fetchPayableInstallments(): Promise<void> {
    isLoading.value = true
    error.value = null

    const response = await api.get<PayableInstallmentsListApiResponse>(
      '/v1/finances/payable-installments'
    )

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar parcelas',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      payableInstallments.value = response.data.installments.map(toPayableInstallment)
    }

    isLoading.value = false
  }

  // ------------------------------------------------------------------
  // Installment payments
  // ------------------------------------------------------------------

  /**
   * Creates a grouped Pix payment for selected subscription installments.
   * Total amount computed server-side.
   */
  async function createInstallmentPayment(
    subscriptionIds: string[]
  ): Promise<InstallmentPayment | 'duplicate' | null> {
    isLoading.value = true
    error.value = null

    const response = await api.post<InstallmentPaymentApiResponse>(
      '/v1/finances/installment-payments',
      { subscription_ids: subscriptionIds }
    )

    if (response.error) {
      error.value = response.error.message

      // 409 = pending payment already exists — let caller handle UX
      if (response.error.httpStatus === 409) {
        isLoading.value = false
        return 'duplicate'
      }

      toast.add({
        title: 'Erro ao gerar pagamento',
        description: response.error.message,
        color: 'error'
      })
      isLoading.value = false
      return null
    }

    if (response.data) {
      const payment = toInstallmentPayment(response.data)
      currentPayment.value = payment
      isLoading.value = false
      return payment
    }

    isLoading.value = false
    return null
  }

  /**
   * Retrieves details for a specific installment payment.
   */
  async function getInstallmentPayment(paymentId: string): Promise<InstallmentPayment | null> {
    const response = await api.get<InstallmentPaymentApiResponse>(
      `/v1/finances/installment-payments/${paymentId}`
    )

    if (response.error) {
      toast.add({
        title: 'Erro ao carregar pagamento',
        description: response.error.message,
        color: 'error'
      })
      return null
    }

    if (response.data) {
      const payment = toInstallmentPayment(response.data)
      currentPayment.value = payment
      return payment
    }

    return null
  }

  // ------------------------------------------------------------------
  // Withdrawable subscriptions
  // ------------------------------------------------------------------

  /**
   * Fetches subscriptions eligible for value withdrawal.
   */
  async function fetchWithdrawableSubscriptions(): Promise<void> {
    isLoading.value = true
    error.value = null

    const response = await api.get<WithdrawableSubscriptionsListApiResponse>(
      '/v1/finances/withdrawable-subscriptions'
    )

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar planos',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      withdrawableSubscriptions.value = response.data.subscriptions.map(toWithdrawableSubscription)
    }

    isLoading.value = false
  }

  // ------------------------------------------------------------------
  // Plan withdrawal
  // ------------------------------------------------------------------

  /**
   * Requests withdrawal from a subscription with plan closure.
   */
  async function requestPlanWithdrawal(
    subscriptionId: string,
    pixData: { ownerName: string; pixKeyType: string; pixKey: string }
  ): Promise<PlanWithdrawal | null> {
    isLoading.value = true
    error.value = null

    const response = await api.post<PlanWithdrawalApiResponse>(
      '/v1/finances/plan-withdrawals',
      {
        subscription_id: subscriptionId,
        owner_name: pixData.ownerName,
        pix_key_type: pixData.pixKeyType,
        pix_key: pixData.pixKey
      }
    )

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao solicitar retirada',
        description: response.error.message,
        color: 'error'
      })
      isLoading.value = false
      return null
    }

    if (response.data) {
      const r = response.data
      isLoading.value = false
      return {
        subscriptionId: r.subscription_id,
        subscriptionName: r.subscription_name,
        planTitle: r.plan_title,
        status: r.status,
        amountCents: r.amount_cents,
        isEarlyTermination: r.is_early_termination,
        createdAt: r.created_at
      }
    }

    isLoading.value = false
    return null
  }

  // ------------------------------------------------------------------
  // History
  // ------------------------------------------------------------------

  /**
   * Fetches unified financial history for the current user.
   */
  async function fetchHistory(limit = 50, offset = 0): Promise<void> {
    isLoading.value = true
    error.value = null

    const response = await api.get<HistoryListApiResponse>(
      '/v1/finances/history',
      { limit, offset }
    )

    if (response.error) {
      error.value = response.error.message
      toast.add({
        title: 'Erro ao carregar histórico',
        description: response.error.message,
        color: 'error'
      })
    } else if (response.data) {
      historyEvents.value = response.data.events.map(toHistoryEvent)
    }

    isLoading.value = false
  }

  return {
    // State
    payableInstallments,
    withdrawableSubscriptions,
    historyEvents,
    currentPayment,
    isLoading,
    error,
    // Actions
    fetchPayableInstallments,
    createInstallmentPayment,
    getInstallmentPayment,
    fetchWithdrawableSubscriptions,
    requestPlanWithdrawal,
    fetchHistory
  }
}
