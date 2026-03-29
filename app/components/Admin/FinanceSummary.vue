<script setup lang="ts">
/**
 * FinanceSummary component for Admin.
 * Displays key financial metrics including Fundo Garantidor.
 * Per guardrails: All values are provided by backend, no calculations.
 */

interface FinanceSummary {
  fundoGarantidorCents: number
  totalInflowCents: number
  totalOutflowCents: number
  netBalanceCents: number
}

defineProps<{
  summary: FinanceSummary
}>()

const { formatCurrency } = useCurrency()
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <UCard>
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
          <UIcon name="i-lucide-shield-check" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Fundo de proteção</p>
          <p class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(summary.fundoGarantidorCents) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
          <UIcon name="i-lucide-trending-up" class="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Entradas</p>
          <p class="text-xl font-semibold text-green-600 dark:text-green-400">
            {{ formatCurrency(summary.totalInflowCents) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
          <UIcon name="i-lucide-trending-down" class="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Total Saídas</p>
          <p class="text-xl font-semibold text-red-600 dark:text-red-400">
            {{ formatCurrency(summary.totalOutflowCents) }}
          </p>
        </div>
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center gap-4">
        <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
          <UIcon name="i-lucide-wallet" class="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Saldo Líquido</p>
          <p class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(summary.netBalanceCents) }}
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
