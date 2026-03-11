<script setup lang="ts">
/**
 * FinanceHistoryList — unified financial history timeline.
 *
 * Shows installment payments and plan withdrawals in a single
 * chronological list. Uses UBadge for status and event type.
 *
 * Per guardrails:
 * - No financial calculations. All data comes from the backend.
 */
import type { HistoryEvent } from '~/composables/useFinanceApi'

defineProps<{
  events: HistoryEvent[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view-payment', paymentId: string): void
}>()

function isViewable(event: HistoryEvent): boolean {
  return event.eventType === 'installment_payment'
    && (event.status === 'pending' || event.status === 'confirmed')
}

const { formatCurrency, formatDate } = useCurrency()

function eventTypeLabel(type: string): string {
  switch (type) {
    case 'installment_payment':
      return 'Pagamento'
    case 'plan_withdrawal':
      return 'Retirada'
    default:
      return type
  }
}

function eventTypeColor(type: string): 'primary' | 'warning' {
  return type === 'installment_payment' ? 'primary' : 'warning'
}

function eventTypeIcon(type: string): string {
  return type === 'installment_payment'
    ? 'i-lucide-arrow-down-left'
    : 'i-lucide-arrow-up-right'
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado',
    failed: 'Falhou',
    expired: 'Expirado'
  }
  return labels[status] || status
}

function statusColor(status: string): 'success' | 'warning' | 'error' | 'neutral' {
  const colors: Record<string, 'success' | 'warning' | 'error' | 'neutral'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error',
    failed: 'error',
    expired: 'neutral'
  }
  return colors[status] || 'neutral'
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Histórico Financeiro
      </h3>
    </template>

    <!-- Loading skeleton -->
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

    <!-- Events list -->
    <div
      v-else-if="events.length > 0"
      class="space-y-3"
    >
      <div
        v-for="event in events"
        :key="event.id"
        class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
        :class="{ 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors': isViewable(event) }"
        :role="isViewable(event) ? 'button' : undefined"
        :tabindex="isViewable(event) ? 0 : undefined"
        @click="isViewable(event) && emit('view-payment', event.id)"
        @keydown.enter="isViewable(event) && emit('view-payment', event.id)"
      >
        <!-- Icon -->
        <div class="shrink-0">
          <div
            class="w-8 h-8 rounded-full flex items-center justify-center"
            :class="event.eventType === 'installment_payment'
              ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'"
          >
            <UIcon
              :name="eventTypeIcon(event.eventType)"
              class="w-4 h-4"
            />
          </div>
        </div>

        <!-- Event info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-0.5">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ event.description }}
            </p>
            <UBadge
              :color="eventTypeColor(event.eventType)"
              variant="subtle"
              size="xs"
            >
              {{ eventTypeLabel(event.eventType) }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ formatDate(event.createdAt) }}
            <span v-if="event.planTitles.length > 0">
              · {{ event.planTitles.join(', ') }}
            </span>
            <span v-if="event.confirmedAt">
              · Confirmado em {{ formatDate(event.confirmedAt) }}
            </span>
          </p>
        </div>

        <!-- Amount + status + action hint -->
        <div class="flex items-center gap-3 shrink-0">
          <p class="text-sm font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(event.amountCents) }}
          </p>
          <UBadge
            :color="statusColor(event.status)"
            variant="subtle"
            size="sm"
          >
            {{ statusLabel(event.status) }}
          </UBadge>
          <UIcon
            v-if="isViewable(event)"
            name="i-lucide-chevron-right"
            class="w-4 h-4 text-gray-400 dark:text-gray-500"
          />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div
      v-else
      class="text-center py-8"
    >
      <UIcon
        name="i-lucide-history"
        class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
      />
      <p class="text-gray-500 dark:text-gray-400">
        Nenhum registro financeiro encontrado.
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Quando você pagar parcelas ou retirar valores, eles aparecerão aqui.
      </p>
    </div>
  </UCard>
</template>
