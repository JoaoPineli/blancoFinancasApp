<script setup lang="ts">
/**
 * Client Finance page — "Financeiro".
 *
 * Three tabs:
 * 1. "Pagar parcelas" (default) — select installments, generate Pix payment
 * 2. "Retirar valor" — request withdrawal from completed/active plans
 * 3. "Histórico" — unified timeline of payments + withdrawals
 *
 * Per guardrails:
 * - No financial calculations. All amounts from backend.
 * - All HTTP through useFinanceApi composable.
 * - Simple language for low-literacy audience.
 */
import type { WithdrawableSubscription } from '~/composables/useFinanceApi'

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const { formatCurrency } = useCurrency()
const {
  payableInstallments,
  withdrawableSubscriptions,
  historyEvents,
  currentPayment,
  isLoading,
  fetchPayableInstallments,
  createInstallmentPayment,
  getInstallmentPayment,
  fetchWithdrawableSubscriptions,
  requestPlanWithdrawal,
  fetchHistory
} = useFinanceApi()

const activeTab = ref('pay')

// Pre-selections from query params (e.g. from plans page)
const route = useRoute()
const preselectedSubscriptionId = computed(() => route.query.subscription as string | undefined)

// --- Pay tab state ---
const selectedIds = ref<Set<string>>(new Set())
const showPixView = ref(false)
const showPixFromHistory = ref(false)

function toggleSelection(subscriptionId: string) {
  // Guard: don't toggle items with pending payments
  const inst = payableInstallments.value.find(i => i.subscriptionId === subscriptionId)
  if (inst?.pendingPaymentId) return

  const newSet = new Set(selectedIds.value)
  if (newSet.has(subscriptionId)) {
    newSet.delete(subscriptionId)
  } else {
    newSet.add(subscriptionId)
  }
  selectedIds.value = newSet
}

function selectAll() {
  selectedIds.value = new Set(
    payableInstallments.value
      .filter(i => !i.pendingPaymentId)
      .map(i => i.subscriptionId)
  )
}

function clearSelection() {
  selectedIds.value = new Set()
}

const selectedTotal = computed(() => {
  return payableInstallments.value
    .filter(i => selectedIds.value.has(i.subscriptionId))
    .reduce((sum, i) => sum + i.amountCents, 0)
})

const selectedCount = computed(() => selectedIds.value.size)

const selectableCount = computed(() =>
  payableInstallments.value.filter(i => !i.pendingPaymentId).length
)

async function handleCreatePayment() {
  const ids = Array.from(selectedIds.value)
  const result = await createInstallmentPayment(ids)

  if (result === 'duplicate') {
    // 409 — a pending payment already exists for one of the selected items
    toast.add({
      title: 'Pagamento já em processamento',
      description: 'Já existe um pagamento pendente para uma das parcelas selecionadas. Veja o Histórico para acompanhar.',
      color: 'warning'
    })
    selectedIds.value = new Set()
    await fetchPayableInstallments()
    return
  }

  if (result) {
    showPixView.value = true
    toast.add({
      title: 'Pagamento gerado!',
      description: 'Pague via Pix para confirmar suas parcelas.',
      color: 'success'
    })
  }
}

function handleBackFromPix() {
  const cameFromHistory = showPixFromHistory.value
  showPixView.value = false
  showPixFromHistory.value = false
  currentPayment.value = null
  selectedIds.value = new Set()
  if (cameFromHistory) {
    activeTab.value = 'history'
    fetchHistory()
  } else {
    fetchPayableInstallments()
  }
}

// --- History / Pending → Pix view ---
async function handleViewPayment(paymentId: string) {
  const payment = await getInstallmentPayment(paymentId)
  if (payment) {
    showPixFromHistory.value = true
    showPixView.value = true
    activeTab.value = 'pay'
  }
}

function handleViewPending(paymentId: string) {
  handleViewPayment(paymentId)
}

// --- Withdraw tab state ---
const withdrawalModalOpen = ref(false)
const withdrawalTarget = ref<WithdrawableSubscription | null>(null)
const isWithdrawing = ref(false)

function handleWithdrawClick(subscriptionId: string) {
  withdrawalTarget.value = withdrawableSubscriptions.value.find(
    s => s.subscriptionId === subscriptionId
  ) ?? null
  withdrawalModalOpen.value = true
}

async function handleWithdrawConfirm(subscriptionId: string) {
  isWithdrawing.value = true
  const result = await requestPlanWithdrawal(subscriptionId)
  isWithdrawing.value = false

  if (result) {
    withdrawalModalOpen.value = false
    withdrawalTarget.value = null
    toast.add({
      title: 'Retirada solicitada!',
      description: `Valor de ${formatCurrency(result.amountCents)} será processado em até 3 dias úteis.`,
      color: 'success'
    })
    fetchWithdrawableSubscriptions()
    fetchHistory()
  }
}

// --- Tab change handlers ---
function handleTabChange(tab: string | number) {
  activeTab.value = String(tab)
}

watch(activeTab, (tab) => {
  if (tab === 'pay') fetchPayableInstallments()
  else if (tab === 'withdraw') fetchWithdrawableSubscriptions()
  else if (tab === 'history') fetchHistory()
})

// --- Init ---
onMounted(async () => {
  // Respect tab from query params before fetching
  const queryTab = route.query.tab as string | undefined
  if (queryTab === 'withdraw' || queryTab === 'history' || queryTab === 'pay') {
    activeTab.value = queryTab
  }

  // Pre-select subscription from query params
  if (preselectedSubscriptionId.value) {
    selectedIds.value = new Set([preselectedSubscriptionId.value])
  }

  // Fetch data for the active tab
  if (activeTab.value === 'pay') {
    await fetchPayableInstallments()
  } else if (activeTab.value === 'withdraw') {
    await fetchWithdrawableSubscriptions()
  } else if (activeTab.value === 'history') {
    await fetchHistory()
  }
})
</script>

<template>
  <div class="space-y-6 max-w-4xl mx-auto">
    <!-- Page header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Financeiro
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Pague suas parcelas, retire valores ou veja seu histórico.
      </p>
    </div>

    <!-- Tabs -->
    <UTabs
      :model-value="activeTab"
      :items="[
        { label: 'Pagar parcelas', value: 'pay', icon: 'i-lucide-credit-card' },
        { label: 'Retirar valor', value: 'withdraw', icon: 'i-lucide-arrow-up-right' },
        { label: 'Histórico', value: 'history', icon: 'i-lucide-history' }
      ]"
      @update:model-value="handleTabChange"
    />

    <!-- ==================== PAY TAB ==================== -->
    <div v-if="activeTab === 'pay'">
      <!-- Pix view (after payment creation) -->
      <ClientPaymentPixView
        v-if="showPixView && currentPayment"
        :payment="currentPayment"
        @back="handleBackFromPix"
      />

      <!-- Installment selection -->
      <div
        v-else
        class="space-y-4"
      >
        <!-- Loading -->
        <div
          v-if="isLoading"
          class="space-y-3"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        </div>

        <!-- Empty state -->
        <UCard v-else-if="payableInstallments.length === 0">
          <div class="text-center py-6">
            <UIcon
              name="i-lucide-check-circle"
              class="w-12 h-12 text-green-400 mx-auto mb-3"
            />
            <p class="text-gray-700 dark:text-gray-300 font-medium">
              Tudo em dia!
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Nenhuma parcela pendente no momento.
            </p>
          </div>
        </UCard>

        <!-- Installment list -->
        <template v-else>
          <!-- Select all / clear -->
          <div class="flex items-center justify-between">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ selectableCount }}
              {{ selectableCount === 1 ? 'parcela disponível' : 'parcelas disponíveis' }}
            </p>
            <div class="flex gap-2">
              <UButton
                v-if="selectedCount < selectableCount"
                variant="ghost"
                size="xs"
                @click="selectAll"
              >
                Selecionar todas
              </UButton>
              <UButton
                v-if="selectedCount > 0"
                variant="ghost"
                size="xs"
                color="neutral"
                @click="clearSelection"
              >
                Limpar seleção
              </UButton>
            </div>
          </div>

          <!-- Cards -->
          <div class="space-y-2">
            <ClientPayableInstallmentCard
              v-for="inst in payableInstallments"
              :key="inst.subscriptionId"
              :installment="inst"
              :selected="selectedIds.has(inst.subscriptionId)"
              @toggle="toggleSelection(inst.subscriptionId)"
              @view-pending="handleViewPending"
            />
          </div>

          <!-- Payment summary bar -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-4"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-4"
          >
            <div
              v-if="selectedCount > 0"
              class="sticky bottom-4 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg flex items-center justify-between gap-4"
            >
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ selectedCount }}
                  {{ selectedCount === 1 ? 'parcela selecionada' : 'parcelas selecionadas' }}
                </p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(selectedTotal) }}
                </p>
              </div>
              <UButton
                color="primary"
                size="lg"
                :loading="isLoading"
                @click="handleCreatePayment"
              >
                Pagar via Pix
              </UButton>
            </div>
          </Transition>
        </template>
      </div>
    </div>

    <!-- ==================== WITHDRAW TAB ==================== -->
    <div v-if="activeTab === 'withdraw'">
      <!-- Loading -->
      <div
        v-if="isLoading"
        class="space-y-3"
      >
        <div
          v-for="i in 2"
          :key="i"
          class="h-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
      </div>

      <!-- Empty state -->
      <UCard v-else-if="withdrawableSubscriptions.length === 0">
        <div class="text-center py-6">
          <UIcon
            name="i-lucide-piggy-bank"
            class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
          />
          <p class="text-gray-700 dark:text-gray-300 font-medium">
            Nenhum plano disponível para retirada
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Quando seus planos forem concluídos ou tiverem parcelas pagas, você poderá retirar o valor aqui.
          </p>
        </div>
      </UCard>

      <!-- Withdrawable plans list -->
      <div
        v-else
        class="space-y-4"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Selecione o plano do qual deseja retirar o valor.
        </p>
        <ClientWithdrawablePlanCard
          v-for="sub in withdrawableSubscriptions"
          :key="sub.subscriptionId"
          :subscription="sub"
          @withdraw="handleWithdrawClick"
        />
      </div>

      <!-- Withdrawal confirmation modal -->
      <ClientWithdrawalConfirmationModal
        v-model:open="withdrawalModalOpen"
        :subscription="withdrawalTarget"
        :is-loading="isWithdrawing"
        @confirm="handleWithdrawConfirm"
      />
    </div>

    <!-- ==================== HISTORY TAB ==================== -->
    <div v-if="activeTab === 'history'">
      <ClientFinanceHistoryList
        :events="historyEvents"
        :is-loading="isLoading"
        @view-payment="handleViewPayment"
      />
    </div>
  </div>
</template>
