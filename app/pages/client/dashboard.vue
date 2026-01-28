<script setup lang="ts">
/**
 * Client Dashboard page.
 * Per guardrails:
 * - Pages orchestrate data fetching and pass to components
 * - All financial values are from backend (mock)
 * - No calculations performed here
 */

definePageMeta({
  middleware: ['auth']
})

const { clientDashboard, installments } = useMockData()
const { formatCurrency, formatDate, formatPercent } = useCurrency()

// Mock yield history data (from backend)
const yieldHistory = [
  { month: 'Set', valueCents: 21500 },
  { month: 'Out', valueCents: 21800 },
  { month: 'Nov', valueCents: 22200 },
  { month: 'Dez', valueCents: 22500 },
  { month: 'Jan', valueCents: 22850 }
]

const activePlan = computed(() => {
  if (!clientDashboard.activePlanId) return null
  const { getPlanById } = useMockData()
  return getPlanById(clientDashboard.activePlanId)
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Dashboard
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Acompanhe seus investimentos e rendimentos.
      </p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <ClientBalanceCard
        title="Saldo Total"
        :value="formatCurrency(clientDashboard.totalBalanceCents)"
        icon="i-lucide-wallet"
        trend="up"
      />
      <ClientBalanceCard
        title="Rendimento do Mês"
        :value="formatCurrency(clientDashboard.yieldThisMonthCents)"
        icon="i-lucide-trending-up"
        trend="up"
      />
      <ClientBalanceCard
        title="Próximo Pagamento"
        :value="formatCurrency(clientDashboard.nextPaymentCents)"
        icon="i-lucide-calendar"
        :subtitle="formatDate(clientDashboard.nextPaymentDate)"
      />
    </div>

    <!-- Active Plan -->
    <UCard v-if="activePlan">
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Plano Ativo
          </h2>
          <UBadge color="success" variant="subtle">
            Ativo
          </UBadge>
        </div>
      </template>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Nome do Plano</p>
          <p class="font-medium text-gray-900 dark:text-white">{{ activePlan.name }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Rendimento Mensal</p>
          <p class="font-medium text-green-600 dark:text-green-400">
            {{ formatPercent(activePlan.yieldRateMonthly) }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Prazo</p>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ activePlan.termMonths }} meses
          </p>
        </div>
      </div>

      <template #footer>
        <NuxtLink to="/client/plans">
          <UButton variant="soft" trailing-icon="i-lucide-arrow-right">
            Ver detalhes do plano
          </UButton>
        </NuxtLink>
      </template>
    </UCard>

    <!-- Charts and History -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ClientYieldChart :data="yieldHistory" />
      <ClientInstallmentTimeline :installments="installments.slice(0, 4)" />
    </div>

    <!-- Quick Actions -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Ações Rápidas
        </h2>
      </template>

      <div class="flex flex-wrap gap-3">
        <NuxtLink to="/client/finance">
          <UButton icon="i-lucide-plus" color="primary">
            Novo Depósito
          </UButton>
        </NuxtLink>
        <NuxtLink to="/client/finance">
          <UButton icon="i-lucide-arrow-up-right" variant="soft">
            Solicitar Saque
          </UButton>
        </NuxtLink>
        <NuxtLink to="/client/support">
          <UButton icon="i-lucide-message-circle" variant="soft" color="neutral">
            Falar com Suporte
          </UButton>
        </NuxtLink>
      </div>
    </UCard>
  </div>
</template>
