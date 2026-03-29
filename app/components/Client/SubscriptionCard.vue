<script setup lang="ts">
/**
 * SubscriptionCard — detailed card view for a single subscription.
 *
 * Layout:
 *   Header      → Name + overdue badge + status badge + kebab menu
 *   Summary     → 3-col grid: Progresso | Próximo vencimento | Valor acumulado (always visible)
 *   Details     → 2-col grid, collapsible:
 *                   Financeiro:  Objetivo | Parcela mensal
 *                   Parcelas:    Parcela atual | Total de parcelas
 *                   Calendário:  Dia do depósito | Data de criação
 *                   Retornos:    Taxas estimadas | Rendimento poupança
 *
 * Per guardrails:
 * - No financial calculations. Fee ratio is display-only.
 * - Component emits user intent — page/parent handles side-effects.
 */
import type { Subscription } from '~/composables/useSubscriptionsApi'
import { FEE_ATTENTION_THRESHOLD_PERCENT } from '~/composables/useSubscriptionHelpers'

export interface SubscriptionAction {
  type: 'rename' | 'terminate' | 'history' | 'pay' | 'withdraw' | 'activate'
  subscriptionId: string
}

const props = defineProps<{
  subscription: Subscription
  expanded: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle-expand'): void
  (e: 'action', payload: SubscriptionAction): void
}>()

const { formatCurrency, formatPercent, formatDate, formatDayOfMonth } = useCurrency()
const {
  statusLabel,
  statusColor,
  statusAriaLabel,
  daysUntilLabel,
  isFeeHighlighted,
  feePercentOfTarget
} = useSubscriptionHelpers()

const sub = computed(() => props.subscription)
const totalAccumulatedCents = computed(() =>
  (sub.value.accumulatedCents ?? 0) + sub.value.yieldCents
)

const feePercent = computed(() =>
  feePercentOfTarget(sub.value.totalCostCents, sub.value.targetAmountCents)
)
const showFeeWarning = computed(() =>
  isFeeHighlighted(sub.value.totalCostCents, sub.value.targetAmountCents)
)
const dueDateLabel = computed(() => daysUntilLabel(sub.value.nextDueDate))

const hasDeposits = computed(() => totalAccumulatedCents.value > 0)
const isEnded = computed(() => sub.value.status === 'cancelled' || sub.value.status === 'completed')
const isInactive = computed(() => sub.value.status === 'inactive')

/** Kebab menu items — grouped for UDropdownMenu */
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
      hasDeposits.value
        ? {
            label: 'Retirar valor',
            icon: 'i-lucide-arrow-up-right',
            onSelect: () => emit('action', { type: 'withdraw', subscriptionId: sub.value.id })
          }
        : {
            label: 'Cancelar plano',
            icon: 'i-lucide-x-circle',
            color: 'error' as const,
            onSelect: () => emit('action', { type: 'terminate', subscriptionId: sub.value.id })
          }
    ]
  ]
})

/** Fee tooltip text explaining the calculation basis */
const feeTooltipText = computed(() => {
  const threshold = (FEE_ATTENTION_THRESHOLD_PERCENT * 100).toFixed(0)
  return `Inclui taxa administrativa, seguro e fundo de proteção. Taxas acima de ${threshold}% do objetivo são destacadas.`
})
</script>

<template>
  <UCard :class="{ 'opacity-55': isEnded }">
    <!-- HEADER: Name, overdue badge, status, kebab -->
    <template #header>
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {{ sub.name || sub.planTitle }}
          </h3>
          <UBadge
            v-if="sub.hasOverdueDeposit"
            color="error"
            variant="subtle"
          >
            Parcela em atraso
          </UBadge>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <UBadge
            :color="statusColor(sub.status)"
            :aria-label="statusAriaLabel(sub.status)"
          >
            {{ statusLabel(sub.status) }}
          </UBadge>
          <UDropdownMenu :items="menuItems">
            <UButton
              icon="i-lucide-more-vertical"
              variant="ghost"
              color="neutral"
              size="sm"
              aria-label="Ações do plano"
            />
          </UDropdownMenu>
        </div>
      </div>
    </template>

    <!-- SUMMARY (always visible): Progresso | Próximo vencimento | Valor acumulado -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Progresso
        </p>
        <ClientSubscriptionProgressBar
          :accumulated-cents="totalAccumulatedCents"
          :target-cents="sub.targetAmountCents"
        />
      </div>

      <div>
        <div v-if="sub.status === 'inactive'">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Próximo vencimento
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 italic">
            Aguardando ativação
          </p>
        </div>
        <div v-else-if="sub.status !== 'cancelled' && sub.nextDueDate">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
            Próximo vencimento
          </p>
          <p class="text-lg font-semibold text-gray-900 dark:text-white">
            {{ formatDate(sub.nextDueDate + 'T00:00:00') }}
          </p>
          <p
            v-if="dueDateLabel"
            class="text-xs text-gray-500 dark:text-gray-400"
          >
            {{ dueDateLabel }}
          </p>
        </div>
      </div>

      <div>
        <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
          Valor acumulado
        </p>
        <p class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ sub.accumulatedCents != null ? formatCurrency(totalAccumulatedCents) : '—' }}
        </p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          de {{ formatCurrency(sub.targetAmountCents) }}
        </p>
      </div>
    </div>

    <!-- DETAILS (collapsible) -->
    <Transition
      enter-active-class="transition-all duration-200 ease-out"
      enter-from-class="opacity-0 max-h-0"
      enter-to-class="opacity-100 max-h-[32rem]"
      leave-active-class="transition-all duration-150 ease-in"
      leave-from-class="opacity-100 max-h-[32rem]"
      leave-to-class="opacity-0 max-h-0"
    >
      <div
        v-if="expanded"
        :id="`details-${sub.id}`"
        class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          <!-- Grupo: Financeiro -->
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Objetivo
            </p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(sub.targetAmountCents) }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Parcela mensal
            </p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(sub.monthlyAmountCents) }}
            </p>
          </div>

          <!-- Grupo: Parcelas -->
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Parcela atual
            </p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ sub.depositsPaid + 1 }}ª de {{ sub.depositCount }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total de parcelas
            </p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ sub.depositCount }} {{ sub.depositCount === 1 ? 'parcela' : 'parcelas' }}
            </p>
          </div>

          <!-- Grupo: Calendário -->
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Dia do depósito
            </p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ formatDayOfMonth(sub.depositDayOfMonth) }}
            </p>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Data de criação
            </p>
            <p class="text-base font-semibold text-gray-900 dark:text-white">
              {{ formatDate(sub.createdAt) }}
            </p>
          </div>

          <!-- Grupo: Custos e retornos -->
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1">
              Taxas estimadas
              <UTooltip :text="feeTooltipText">
                <UIcon
                  name="i-lucide-info"
                  class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-help"
                  aria-label="Informações sobre taxas"
                />
              </UTooltip>
            </p>
            <div class="flex items-baseline gap-2">
              <p
                class="text-base font-semibold"
                :class="showFeeWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-900 dark:text-white'"
              >
                {{ formatCurrency(sub.totalCostCents) }}
              </p>
              <span
                v-if="feePercent !== null"
                class="text-xs"
                :class="showFeeWarning
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'"
              >
                ({{ formatPercent(feePercent) }} do objetivo)
              </span>
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-300">
              Rendimento poupança
            </p>
            <p class="text-base font-semibold text-green-600 dark:text-green-400">
              {{ sub.yieldCents > 0 ? "+" + formatCurrency(sub.yieldCents) : '—' }}
            </p>
          </div>
        </div>
      </div>
    </Transition>

    <div class="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
      <button
        type="button"
        class="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded px-1 py-0.5 transition-colors"
        :aria-expanded="expanded"
        :aria-controls="`details-${sub.id}`"
        @click="emit('toggle-expand')"
      >
        <UIcon
          :name="expanded ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
          class="w-4 h-4 transition-transform"
        />
        {{ expanded ? 'Menos detalhes' : 'Mais detalhes' }}
      </button>
    </div>
  </UCard>
</template>
