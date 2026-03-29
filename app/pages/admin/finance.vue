<script setup lang="ts">
/**
 * Admin Finance page.
 * Cash flow, conciliation, and Fundo Garantidor metrics.
 * Per guardrails: All values from backend, no calculations.
 */

definePageMeta({
  middleware: ['auth']
})

const { adminFinanceSummary, cashFlow } = useMockData()
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Controle Financeiro
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Acompanhe o fluxo de caixa e métricas financeiras.
      </p>
    </div>

    <!-- Finance Summary -->
    <AdminFinanceSummary :summary="adminFinanceSummary" />

    <!-- Cash Flow -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Fluxo de Caixa
          </h2>
          <div class="flex gap-2">
            <UButton
              icon="i-lucide-filter"
              variant="soft"
              color="neutral"
              size="sm"
            >
              Filtrar
            </UButton>
          </div>
        </div>
      </template>

      <AdminCashFlowTable :entries="cashFlow" />
    </UCard>

    <!-- Conciliation Alert -->
    <UAlert
      icon="i-lucide-info"
      color="info"
      variant="subtle"
      title="Conciliação"
      description="A conciliação bancária é realizada automaticamente. Verifique o relatório de conciliação para detalhes."
    />

    <!-- Fundo de proteção Details -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-shield-check"
            class="w-5 h-5 text-primary-500"
          />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Fundo de proteção
          </h2>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          O Fundo de proteção é uma reserva financeira destinada a proteger os investidores
          em caso de eventualidades. Os valores são atualizados automaticamente pelo sistema.
        </p>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Saldo Atual
            </p>
            <p class="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {{ useCurrency().formatCurrency(adminFinanceSummary.fundoGarantidorCents) }}
            </p>
          </div>
          <div class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Status
            </p>
            <div class="flex items-center gap-2 mt-1">
              <div class="w-3 h-3 bg-green-500 rounded-full" />
              <span class="text-lg font-medium text-gray-900 dark:text-white">Saudável</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>
