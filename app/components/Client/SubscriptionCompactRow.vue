<script setup lang="ts">
/**
 * SubscriptionCompactRow — single-row view of a subscription for compact mode.
 *
 * Displays: Name | Progress mini-bar | Next due date | Status badge | Kebab menu
 *
 * Per guardrails:
 * - No financial calculations.
 * - Component emits user intent only.
 */
import type { Subscription } from '~/composables/useSubscriptionsApi'
import type { SubscriptionAction } from '~/components/Client/SubscriptionCard.vue'

const props = defineProps<{
  subscription: Subscription
}>()

const emit = defineEmits<{
  (e: 'action', payload: SubscriptionAction): void
}>()

const { formatCurrency, formatDate } = useCurrency()
const { statusLabel, statusColor, statusAriaLabel, daysUntilLabel } = useSubscriptionHelpers()

const sub = computed(() => props.subscription)
const dueDateLabel = computed(() => daysUntilLabel(sub.value.nextDueDate))
const totalAccumulatedCents = computed(() =>
  (sub.value.accumulatedCents ?? 0) + sub.value.yieldCents
)

const menuItems = computed(() => [
  [
    {
      label: 'Editar plano',
      icon: 'i-lucide-pencil',
      onSelect: () => emit('action', { type: 'edit', subscriptionId: sub.value.id })
    },
    {
      label: sub.value.status === 'active' ? 'Pausar' : 'Retomar',
      icon: sub.value.status === 'active' ? 'i-lucide-pause' : 'i-lucide-play',
      onSelect: () => emit('action', {
        type: sub.value.status === 'active' ? 'pause' : 'resume',
        subscriptionId: sub.value.id
      })
    },
    {
      label: 'Ver histórico',
      icon: 'i-lucide-history',
      onSelect: () => emit('action', { type: 'history', subscriptionId: sub.value.id })
    }
  ],
  [
    {
      label: 'Encerrar',
      icon: 'i-lucide-x-circle',
      color: 'error' as const,
      onSelect: () => emit('action', { type: 'terminate', subscriptionId: sub.value.id })
    }
  ]
])
</script>

<template>
  <div
    class="flex flex-wrap md:flex-nowrap items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    role="listitem"
  >
    <!-- Name -->
    <div class="flex-1 min-w-0 basis-full md:basis-auto order-1">
      <p class="font-medium text-gray-900 dark:text-white truncate">
        {{ sub.name || sub.planTitle }}
      </p>
      <p
        v-if="sub.hasOverdueDeposit"
        class="text-xs text-red-500 dark:text-red-400"
      >
        Depósito em atraso
      </p>
    </div>

    <!-- Progress mini bar -->
    <div class="shrink-0 w-24 order-2 md:order-2">
      <ClientSubscriptionProgressBar
        :accumulated-cents="totalAccumulatedCents"
        :target-cents="sub.targetAmountCents"
        compact
      />
    </div>

    <!-- Accumulated value -->
    <div class="shrink-0 w-28 text-sm text-right text-gray-700 dark:text-gray-300 order-3 md:order-3">
      <span class="md:hidden text-xs text-gray-500 mr-1">Acumulado:</span>
      {{ sub.accumulatedCents != null ? formatCurrency(totalAccumulatedCents) : '—' }}
    </div>

    <!-- Next due -->
    <div class="shrink-0 w-28 text-sm text-right order-4 md:order-4">
      <p class="text-gray-700 dark:text-gray-300">
        {{ formatDate(sub.nextDueDate + 'T00:00:00') }}
      </p>
      <p
        v-if="dueDateLabel"
        class="text-[10px] text-gray-500 dark:text-gray-400"
      >
        {{ dueDateLabel }}
      </p>
    </div>

    <!-- Status -->
    <div class="shrink-0 w-28 flex justify-end order-5">
      <UBadge
        :color="statusColor(sub.status)"
        :aria-label="statusAriaLabel(sub.status)"
        size="sm"
      >
        {{ statusLabel(sub.status) }}
      </UBadge>
    </div>

    <!-- Kebab menu -->
    <div class="shrink-0 order-6">
      <UDropdownMenu :items="menuItems">
        <UButton
          icon="i-lucide-more-vertical"
          variant="ghost"
          color="neutral"
          size="xs"
          aria-label="Ações do plano"
        />
      </UDropdownMenu>
    </div>
  </div>
</template>
