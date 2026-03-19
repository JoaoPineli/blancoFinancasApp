<script setup lang="ts">
/**
 * ClientDashboardInstallmentsCard — payable installments section for the dashboard.
 *
 * Shows the first N upcoming/overdue installments.
 * Follows the icon + row design pattern of ClientHistoricoParcelasCard.
 *
 * Per guardrails:
 * - No financial calculations. All values come from backend via props.
 */
import type { PayableInstallment } from '~/composables/useFinanceApi'

defineProps<{
  installments: PayableInstallment[]
  isLoading?: boolean
}>()

const { formatCurrency, formatDate } = useCurrency()

function statusIcon(status: PayableInstallment['status']): string {
  switch (status) {
    case 'overdue': return 'i-lucide-alert-circle'
    case 'due_today': return 'i-lucide-alarm-clock'
    default: return 'i-lucide-clock'
  }
}

function statusIconClass(status: PayableInstallment['status']): string {
  switch (status) {
    case 'overdue': return 'text-red-500'
    case 'due_today': return 'text-amber-500'
    default: return 'text-gray-400 dark:text-gray-500'
  }
}

function statusLabel(status: PayableInstallment['status']): string {
  switch (status) {
    case 'overdue': return 'Em atraso'
    case 'due_today': return 'Vence hoje'
    default: return 'A vencer'
  }
}

function statusColor(status: PayableInstallment['status']): 'error' | 'warning' | 'neutral' {
  switch (status) {
    case 'overdue': return 'error'
    case 'due_today': return 'warning'
    default: return 'neutral'
  }
}
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Parcelas para pagar
        </h2>
        <NuxtLink to="/client/finance?tab=pay">
          <UButton
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-arrow-right"
          >
            Ver todas
          </UButton>
        </NuxtLink>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="installments.length === 0"
      class="text-center py-8 flex-1 flex flex-col items-center justify-center"
    >
      <UIcon
        name="i-lucide-check-circle"
        class="w-10 h-10 text-green-400 mb-2"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Tudo em dia!
      </p>
    </div>

    <!-- Installments list (scrollable) -->
    <div
      v-else
      class="space-y-3 max-h-64 overflow-y-auto pr-1"
    >
      <NuxtLink
        v-for="inst in installments"
        :key="inst.subscriptionId"
        :to="`/client/finance?tab=pay&subscription=${inst.subscriptionId}`"
        class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div class="shrink-0">
          <UIcon
            :name="statusIcon(inst.status)"
            class="w-6 h-6"
            :class="statusIconClass(inst.status)"
          />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ inst.subscriptionName }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ inst.planTitle }} · vence {{ formatDate(inst.dueDate + 'T00:00:00') }}
          </p>
        </div>

        <div class="shrink-0 flex items-center gap-2">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(inst.amountCents) }}
          </span>
          <UBadge
            :color="statusColor(inst.status)"
            variant="subtle"
            size="sm"
            class="w-17 justify-center"
          >
            {{ statusLabel(inst.status) }}
          </UBadge>
        </div>
      </NuxtLink>
    </div>
  </UCard>
</template>
