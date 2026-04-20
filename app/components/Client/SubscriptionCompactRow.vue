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

const isEnded = computed(() => sub.value.status === 'cancelled' || sub.value.status === 'completed')
const isInactive = computed(() => sub.value.status === 'inactive')

const menuItems = computed(() => {
  if (isEnded.value) {
    return [[
      {
        label: 'Ver histórico',
        icon: 'i-lucide-history',
        onSelect: () => emit('action', { type: 'history', subscriptionId: sub.value.id })
      }
    ]]
  }

  if (isInactive.value) {
    return [
      [
        {
          label: 'Alterar nome',
          icon: 'i-lucide-pencil',
          onSelect: () => emit('action', { type: 'rename', subscriptionId: sub.value.id })
        },
        {
          label: 'Ativar plano',
          icon: 'i-lucide-zap',
          onSelect: () => emit('action', { type: 'activate', subscriptionId: sub.value.id })
        }
      ],
      [
        {
          label: 'Cancelar plano',
          icon: 'i-lucide-x-circle',
          color: 'error' as const,
          onSelect: () => emit('action', { type: 'terminate', subscriptionId: sub.value.id })
        }
      ]
    ]
  }

  return [
    [
      {
        label: 'Alterar nome',
        icon: 'i-lucide-pencil',
        onSelect: () => emit('action', { type: 'rename', subscriptionId: sub.value.id })
      },
      {
        label: 'Pagar parcela',
        icon: 'i-lucide-credit-card',
        onSelect: () => emit('action', { type: 'pay', subscriptionId: sub.value.id })
      },
      {
        label: 'Ver histórico',
        icon: 'i-lucide-history',
        onSelect: () => emit('action', { type: 'history', subscriptionId: sub.value.id })
      }
    ],
    [
      {
        label: 'Retirar valor',
        icon: 'i-lucide-arrow-up-right',
        onSelect: () => emit('action', { type: 'withdraw', subscriptionId: sub.value.id })
      }
    ]
  ]
})
</script>

<template>
  <div
    class="flex flex-wrap md:flex-nowrap items-center gap-3 px-4 py-3 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
    :class="{ 'opacity-55': isEnded }"
    role="listitem"
  >
    <!-- Name -->
    <div class="flex-1 min-w-0 basis-full md:basis-auto">
      <p class="font-medium text-gray-900 dark:text-white truncate">
        {{ sub.name || sub.planTitle }}
      </p>
      <p
        v-if="sub.hasOverdueDeposit"
        class="text-xs text-error-500 dark:text-error-400"
      >
        Depósito em atraso
      </p>
    </div>

    <!-- Progress mini bar -->
    <div class="shrink-0 w-24">
      <ClientSubscriptionProgressBar
        :accumulated-cents="totalAccumulatedCents"
        :target-cents="sub.targetAmountCents"
        compact
      />
    </div>

    <!-- Accumulated value -->
    <div class="shrink-0 w-28 text-sm text-right text-gray-700 dark:text-gray-300">
      <span class="md:hidden text-xs text-gray-500 mr-1">Acumulado:</span>
      {{ sub.accumulatedCents != null ? formatCurrency(totalAccumulatedCents) : '—' }}
    </div>

    <!-- Next due -->
    <div class="shrink-0 w-28 text-sm text-right">
      <div v-if="sub.status === 'inactive'">
        <p class="text-[10px] text-gray-400 dark:text-gray-500 italic">
          Aguardando ativação
        </p>
      </div>
      <div v-else-if="sub.status !== 'cancelled' && sub.nextDueDate">
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
    </div>

    <!-- Status -->
    <div class="shrink-0 w-15 flex justify-center">
      <UBadge
        :color="statusColor(sub.status)"
        :aria-label="statusAriaLabel(sub.status)"
        size="sm"
      >
        {{ statusLabel(sub.status) }}
      </UBadge>
    </div>

    <!-- Kebab menu -->
    <div class="shrink-0">
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
