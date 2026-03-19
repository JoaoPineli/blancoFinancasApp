<script setup lang="ts">
/**
 * Client Dashboard page.
 * Per guardrails:
 * - Pages orchestrate data fetching and pass to components
 * - All financial values are from backend
 * - No calculations performed here
 */

definePageMeta({
  middleware: ['auth']
})

const { formatCurrency } = useCurrency()
const { sortSubscriptions } = useSubscriptionHelpers()

// Dashboard summary
const { dashboard, isLoading: isDashboardLoading, error: dashboardError, fetchDashboard } = useDashboardApi()

// Subscriptions + due status
const { subscriptions, isLoading: isSubsLoading, fetchSubscriptions, getDashboardDueStatus } = useSubscriptionsApi()

const overduePlans = ref<Array<{ subscriptionId: string, planTitle: string, name: string, nextDueDate: string }>>([])
const dueTodayPlans = ref<Array<{ subscriptionId: string, planTitle: string, name: string, nextDueDate: string }>>([])

const bannerSeverity = computed<'error' | 'warn' | null>(() => {
  if (overduePlans.value.length > 0) return 'error'
  if (dueTodayPlans.value.length > 0) return 'warn'
  return null
})

const bannerPlanNames = computed(() => {
  if (overduePlans.value.length > 0) {
    return overduePlans.value.map(p => p.name || p.planTitle).join(', ')
  }
  return dueTodayPlans.value.map(p => p.name || p.planTitle).join(', ')
})

const topSubscriptions = computed(() =>
  sortSubscriptions(subscriptions.value, 'next-due').slice(0, 3)
)

// Finance data (installments + history)
const {
  payableInstallments,
  historyEvents,
  isLoading: isFinanceLoading,
  fetchPayableInstallments,
  fetchHistory
} = useFinanceApi()

const topInstallments = computed(() => payableInstallments.value.slice(0, 3))

const recentInstallmentPayments = computed(() =>
  historyEvents.value
    .filter(e => e.eventType === 'installment_payment')
    .slice(0, 5)
)

onMounted(async () => {
  await Promise.all([
    fetchDashboard(),
    fetchSubscriptions(),
    fetchPayableInstallments(),
    fetchHistory(20, 0),
    getDashboardDueStatus().then((status) => {
      if (status) {
        overduePlans.value = status.overduePlans
        dueTodayPlans.value = status.dueTodayPlans
      }
    })
  ])
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Acompanhe seus planos e retornos.
      </p>
    </div>

    <!-- Deposit Due / Overdue Banner -->
    <div
      v-if="bannerSeverity === 'error'"
      class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 p-4 flex items-center gap-3"
      role="alert"
    >
      <UIcon
        name="i-lucide-alert-circle"
        class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0"
      />
      <div class="flex-1">
        <p class="text-sm font-semibold text-red-800 dark:text-red-200">
          Depósitos em atraso
        </p>
        <p class="text-sm text-red-700 dark:text-red-300">
          Pagamentos pendentes para: {{ bannerPlanNames }}
        </p>
      </div>
      <NuxtLink to="/client/finance?tab=pay">
        <UButton
          size="sm"
          color="error"
          variant="soft"
        >
          Ir para pagamentos
        </UButton>
      </NuxtLink>
    </div>

    <div
      v-else-if="bannerSeverity === 'warn'"
      class="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-4 flex items-start gap-3"
      role="alert"
    >
      <UIcon
        name="i-lucide-alert-triangle"
        class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0"
      />
      <div class="flex-1">
        <p class="text-sm font-semibold text-amber-800 dark:text-amber-200">
          Depósitos vencem hoje
        </p>
        <p class="text-sm text-amber-700 dark:text-amber-300">
          Pagamentos pendentes para: {{ bannerPlanNames }}
        </p>
      </div>
      <NuxtLink to="/client/finance?tab=pay">
        <UButton
          size="sm"
          color="warning"
          variant="soft"
        >
          Ir para pagamentos
        </UButton>
      </NuxtLink>
    </div>

    <!-- Dashboard load error -->
    <UAlert
      v-if="dashboardError"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      title="Não foi possível carregar seu dashboard agora."
    />

    <!-- Row 1: Summary cards — equal height via items-stretch -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      <div
        v-if="isDashboardLoading"
        class="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
      <ClientBalanceCard
        v-else
        title="Saldo total"
        :value="dashboard ? formatCurrency(dashboard.totalBalanceCents) : '—'"
        icon="i-lucide-wallet"
        trend="up"
      />

      <div
        v-if="isDashboardLoading"
        class="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
      <ClientBalanceCard
        v-else
        title="Lucro do mês"
        :value="dashboard ? formatCurrency(dashboard.yieldThisMonthCents) : '—'"
        icon="i-lucide-trending-up"
        trend="up"
        :subtitle="dashboard ? `Referência: ${dashboard.referenceMonth}` : undefined"
      />
    </div>

    <!-- Row 2: Plans + Payable installments — equal height via items-stretch -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      <ClientDashboardPlansCard
        :subscriptions="topSubscriptions"
        :is-loading="isSubsLoading"
      />
      <ClientDashboardInstallmentsCard
        :installments="topInstallments"
        :is-loading="isFinanceLoading"
      />
    </div>

    <!-- Row 3: Payment history + Shortcuts — equal height via items-stretch -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      <ClientHistoricoParcelasCard
        :events="recentInstallmentPayments"
        :is-loading="isFinanceLoading"
      />
    </div>
  </div>
</template>
