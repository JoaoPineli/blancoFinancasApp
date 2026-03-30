<script setup lang="ts">
/**
 * Admin Dashboard page.
 * Per guardrails:
 * - Pages orchestrate data fetching and pass to components
 * - All financial values are from backend
 * - No calculations performed here
 */

definePageMeta({
  middleware: ['auth']
})

const { formatCurrency } = useCurrency()

// --- Clients ---
const {
  stats: clientStats,
  isLoading: isLoadingClients,
  fetchClients
} = useAdminClientsApi()

// --- Finance summary (current month) ---
const {
  summary,
  isLoadingSummary,
  summaryError,
  fetchSummary
} = useAdminFinanceApi()

// --- Pending withdrawals ---
const {
  withdrawals: pendingWithdrawals,
  isLoading: isLoadingWithdrawals,
  fetchWithdrawals
} = useAdminWithdrawalsApi()

// --- Plan summaries ---
const {
  planSummaries,
  isLoading: isLoadingPlans,
  fetchPlanSummaries
} = usePlansApi()

// --- Date range: start of current month → today ---
const today = new Date()
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0] || ''
}

const startDate = toIsoDate(firstOfMonth)
const endDate = toIsoDate(today)

// --- Computed ---
const activePlansCount = computed(() =>
  planSummaries.value.filter(p => p.active).length
)

const top5PendingWithdrawals = computed(() =>
  pendingWithdrawals.value.slice(0, 5)
)

const netBalancePositive = computed(() =>
  !summary.value || summary.value.netBalanceCents >= 0
)

const referenceMonth = computed(() => {
  return today.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
})

const isLoading = computed(() =>
  isLoadingClients.value || isLoadingSummary.value || isLoadingWithdrawals.value || isLoadingPlans.value
)

onMounted(async () => {
  await Promise.all([
    fetchClients({ pageSize: 1 }),
    fetchSummary(startDate, endDate),
    fetchWithdrawals('pending'),
    fetchPlanSummaries()
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
        Visão geral da plataforma — {{ referenceMonth }}.
      </p>
    </div>

    <!-- Pending withdrawals alert -->
    <div
      v-if="!isLoadingWithdrawals && pendingWithdrawals.length > 0"
      class="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 p-4 flex items-center gap-3"
      role="alert"
    >
      <UIcon
        name="i-lucide-clock"
        class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0"
      />
      <div class="flex-1">
        <p class="text-sm font-semibold text-amber-800 dark:text-amber-200">
          {{ pendingWithdrawals.length }} {{ pendingWithdrawals.length === 1 ? 'saque pendente' : 'saques pendentes' }} aguardando aprovação
        </p>
      </div>
      <NuxtLink to="/admin/withdrawals">
        <UButton
          size="sm"
          color="warning"
          variant="soft"
        >
          Revisar saques
        </UButton>
      </NuxtLink>
    </div>

    <!-- Inadimplentes alert -->
    <div
      v-if="!isLoadingClients && clientStats.defaulting > 0"
      class="rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950 p-4 flex items-center gap-3"
      role="alert"
    >
      <UIcon
        name="i-lucide-alert-triangle"
        class="w-5 h-5 text-red-600 dark:text-red-400 shrink-0"
      />
      <div class="flex-1">
        <p class="text-sm font-semibold text-red-800 dark:text-red-200">
          {{ clientStats.defaulting }} {{ clientStats.defaulting === 1 ? 'cliente inadimplente' : 'clientes inadimplentes' }}
        </p>
      </div>
      <NuxtLink to="/admin/clients?status=defaulting">
        <UButton
          size="sm"
          color="error"
          variant="soft"
        >
          Ver clientes
        </UButton>
      </NuxtLink>
    </div>

    <!-- Row 1: Primary KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
      <!-- Clientes Ativos -->
      <UCard class="h-full">
        <div
          v-if="isLoadingClients"
          class="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-start justify-between"
        >
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Clientes Ativos
            </p>
            <p class="mt-2 text-2xl font-semibold text-green-600 dark:text-green-400">
              {{ clientStats.active }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              de {{ clientStats.total }} no total
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <UIcon
              name="i-lucide-users"
              class="h-6 w-6 text-green-600 dark:text-green-400"
            />
          </div>
        </div>
      </UCard>

      <!-- Saldo Líquido -->
      <UCard class="h-full">
        <div
          v-if="isLoadingSummary"
          class="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-start justify-between"
        >
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Saldo Líquido
            </p>
            <p
              class="mt-2 text-2xl font-semibold"
              :class="netBalancePositive ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400'"
            >
              {{ summary ? formatCurrency(summary.netBalanceCents) : '—' }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              mês atual
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg"
            :class="netBalancePositive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-red-100 dark:bg-red-900/30'"
          >
            <UIcon
              name="i-lucide-wallet"
              class="h-6 w-6"
              :class="netBalancePositive ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'"
            />
          </div>
        </div>
      </UCard>

      <!-- Planos Ativos -->
      <UCard class="h-full">
        <div
          v-if="isLoadingPlans"
          class="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-start justify-between"
        >
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Planos Ativos
            </p>
            <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
              {{ activePlansCount }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              de {{ planSummaries.length }} cadastrados
            </p>
          </div>
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <UIcon
              name="i-lucide-layers"
              class="h-6 w-6 text-gray-600 dark:text-gray-400"
            />
          </div>
        </div>
      </UCard>

      <!-- Saques Pendentes -->
      <UCard class="h-full">
        <div
          v-if="isLoadingWithdrawals"
          class="h-16 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-start justify-between"
        >
          <div>
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
              Saques Pendentes
            </p>
            <p
              class="mt-2 text-2xl font-semibold"
              :class="pendingWithdrawals.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'"
            >
              {{ pendingWithdrawals.length }}
            </p>
            <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
              aguardando aprovação
            </p>
          </div>
          <div
            class="flex h-12 w-12 items-center justify-center rounded-lg"
            :class="pendingWithdrawals.length > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-gray-100 dark:bg-gray-800'"
          >
            <UIcon
              name="i-lucide-arrow-up-from-line"
              class="h-6 w-6"
              :class="pendingWithdrawals.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'"
            />
          </div>
        </div>
      </UCard>
    </div>

    <!-- Row 2: Finance detail cards -->
    <UAlert
      v-if="summaryError"
      color="error"
      variant="soft"
      icon="i-lucide-alert-circle"
      title="Não foi possível carregar os dados financeiros do mês."
    />
    <div
      v-else
      class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-stretch"
    >
      <!-- Entradas do mês -->
      <UCard class="h-full">
        <div
          v-if="isLoadingSummary"
          class="h-14 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-center gap-4"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30 shrink-0">
            <UIcon
              name="i-lucide-trending-up"
              class="w-6 h-6 text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Entradas do Mês
            </p>
            <p class="text-xl font-semibold text-green-600 dark:text-green-400">
              {{ summary ? formatCurrency(summary.totalInflowCents) : '—' }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Saídas do mês -->
      <UCard class="h-full">
        <div
          v-if="isLoadingSummary"
          class="h-14 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-center gap-4"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30 shrink-0">
            <UIcon
              name="i-lucide-trending-down"
              class="w-6 h-6 text-red-600 dark:text-red-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Saídas do Mês
            </p>
            <p class="text-xl font-semibold text-red-600 dark:text-red-400">
              {{ summary ? formatCurrency(summary.totalOutflowCents) : '—' }}
            </p>
          </div>
        </div>
      </UCard>

      <!-- Fundo de Proteção -->
      <UCard class="h-full">
        <div
          v-if="isLoadingSummary"
          class="h-14 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
        />
        <div
          v-else
          class="flex items-center gap-4"
        >
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30 shrink-0">
            <UIcon
              name="i-lucide-shield-check"
              class="w-6 h-6 text-primary-600 dark:text-primary-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Fundo de Proteção
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ summary ? formatCurrency(summary.fundoGarantidorCents) : '—' }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Row 3: Client breakdown + Pending withdrawals list -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
      <!-- Client breakdown -->
      <UCard class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              Distribuição de Clientes
            </h2>
            <NuxtLink to="/admin/clients">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                trailing-icon="i-lucide-arrow-right"
              >
                Ver todos
              </UButton>
            </NuxtLink>
          </div>
        </template>

        <div
          v-if="isLoadingClients"
          class="space-y-3"
        >
          <div
            v-for="i in 4"
            :key="i"
            class="h-10 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        </div>
        <div
          v-else
          class="divide-y divide-gray-100 dark:divide-gray-800"
        >
          <div class="flex items-center justify-between py-3">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-green-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Ativos</span>
            </div>
            <span class="text-sm font-semibold text-green-600 dark:text-green-400">{{ clientStats.active }}</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-amber-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Registrados (aguardando ativação)</span>
            </div>
            <span class="text-sm font-semibold text-amber-600 dark:text-amber-400">{{ clientStats.registered }}</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-red-500" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Inadimplentes</span>
            </div>
            <span class="text-sm font-semibold text-red-600 dark:text-red-400">{{ clientStats.defaulting }}</span>
          </div>
          <div class="flex items-center justify-between py-3">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-gray-400" />
              <span class="text-sm text-gray-700 dark:text-gray-300">Inativos</span>
            </div>
            <span class="text-sm font-semibold text-gray-500 dark:text-gray-400">{{ clientStats.inactive }}</span>
          </div>
        </div>
      </UCard>

      <!-- Pending withdrawals list -->
      <UCard class="h-full">
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">
              Saques Pendentes
            </h2>
            <NuxtLink to="/admin/withdrawals">
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                trailing-icon="i-lucide-arrow-right"
              >
                Ver todos
              </UButton>
            </NuxtLink>
          </div>
        </template>

        <div
          v-if="isLoadingWithdrawals"
          class="space-y-3"
        >
          <div
            v-for="i in 3"
            :key="i"
            class="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
          />
        </div>
        <p
          v-else-if="top5PendingWithdrawals.length === 0"
          class="py-6 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          Nenhum saque pendente.
        </p>
        <div
          v-else
          class="divide-y divide-gray-100 dark:divide-gray-800"
        >
          <div
            v-for="w in top5PendingWithdrawals"
            :key="w.id"
            class="flex items-center justify-between py-3 gap-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 shrink-0">
                <UIcon
                  name="i-lucide-user"
                  class="w-4 h-4 text-amber-600 dark:text-amber-400"
                />
              </div>
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ w.userName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ w.pixKeyType?.toUpperCase() ?? '—' }}
                </p>
              </div>
            </div>
            <p class="text-sm font-semibold text-gray-900 dark:text-white shrink-0">
              {{ formatCurrency(w.amountCents) }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
