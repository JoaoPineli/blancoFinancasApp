<script setup lang="ts">
/**
 * ClientHistoricoParcelasCard — timeline of installment payment history.
 *
 * Renamed and refactored from ClientInstallmentTimeline.
 * Receives pre-filtered installment_payment history events.
 * Uses icon + color design pattern consistent with the rest of the dashboard.
 *
 * Per guardrails:
 * - No financial calculations. All values come from backend via props.
 */
import type { HistoryEvent } from '~/composables/useFinanceApi'

defineProps<{
  events: HistoryEvent[]
  isLoading?: boolean
}>()

const { formatCurrency, formatDate, formateTime } = useCurrency()

function statusIcon(status: string): string {
  switch (status) {
    case 'confirmed': return 'i-lucide-check-circle'
    case 'pending': return 'i-lucide-clock'
    case 'cancelled':
    case 'failed': return 'i-lucide-x-circle'
    default: return 'i-lucide-circle'
  }
}

function statusIconClass(status: string): string {
  switch (status) {
    case 'confirmed': return 'text-green-500'
    case 'pending': return 'text-amber-500'
    case 'cancelled':
    case 'failed': return 'text-red-500'
    default: return 'text-gray-400'
  }
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    confirmed: 'Confirmado',
    pending: 'Pendente',
    cancelled: 'Cancelado',
    failed: 'Falhou',
    expired: 'Expirado'
  }
  return labels[status] ?? status
}

function statusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' | 'info' {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
    confirmed: 'success',
    pending: 'warning',
    cancelled: 'error',
    failed: 'error',
    expired: 'info'
  }
  return colors[status] ?? 'neutral'
}
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Histórico de parcelas
        </h2>
        <NuxtLink to="/client/finance?tab=history">
          <UButton
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-arrow-right"
          >
            Ver histórico
          </UButton>
        </NuxtLink>
      </div>
    </template>

    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-16 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Events list (scrollable) -->
    <div
      v-else-if="events.length > 0"
      class="space-y-3 max-h-72 overflow-y-auto pr-1"
    >
      <NuxtLink
        v-for="event in events"
        :key="event.id"
        to="/client/finance?tab=history"
        class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <div class="shrink-0">
          <UIcon
            :name="statusIcon(event.status)"
            class="w-6 h-6"
            :class="statusIconClass(event.status)"
          />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
            {{ event.description }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(event.createdAt) }}
            <span v-if="event.confirmedAt">
              · Confirmado às {{ formateTime(event.confirmedAt) }}
            </span>
          </p>
        </div>

        <div class="shrink-0 flex items-center justify-end gap-2">
          <span class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(event.amountCents) }}
          </span>
          <UBadge
            :color="statusColor(event.status)"
            class="w-17 justify-center"
            variant="subtle"
            size="sm"
          >
            {{ statusLabel(event.status) }}
          </UBadge>
        </div>
      </NuxtLink>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-8 flex-1 flex flex-col items-center justify-center"
    >
      <UIcon
        name="i-lucide-history"
        class="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Nenhuma parcela encontrada no histórico.
      </p>
      <NuxtLink to="/client/finance?tab=history">
        <UButton
          variant="soft"
          size="sm"
        >
          Ver histórico completo
        </UButton>
      </NuxtLink>
    </div>
  </UCard>
</template>
