<script setup lang="ts">
/**
 * PayableInstallmentCard — shows a single payable installment with selection.
 *
 * Used in the "Pagar parcelas" tab. Each card represents one installment
 * from an active subscription, with urgency-based styling.
 * When a pending payment already exists, the card is disabled with
 * a "Pagamento em processamento" label and an action to view it.
 *
 * Per guardrails:
 * - No financial calculations. Amount comes from the backend.
 * - Component emits selection intent — parent handles payment creation.
 */
import type { PayableInstallment } from '~/composables/useFinanceApi'

const props = defineProps<{
  installment: PayableInstallment
  selected: boolean
}>()

const emit = defineEmits<{
  (e: 'toggle'): void
  (e: 'view-pending', paymentId: string): void
}>()

const { formatCurrency, formatDate } = useCurrency()
const { daysUntilLabel } = useSubscriptionHelpers()

const inst = computed(() => props.installment)
const hasPending = computed(() => !!inst.value.pendingPaymentId)

const statusConfig = computed(() => {
  if (hasPending.value) {
    return { label: 'Pagamento em processamento', color: 'info' as const, icon: 'i-lucide-loader' }
  }
  switch (inst.value.status) {
    case 'overdue':
      return { label: 'Em atraso', color: 'error' as const, icon: 'i-lucide-alert-circle' }
    case 'due_today':
      return { label: 'Vence hoje', color: 'warning' as const, icon: 'i-lucide-clock' }
    default:
      return { label: 'A vencer', color: 'neutral' as const, icon: 'i-lucide-calendar' }
  }
})

const dueDateLabel = computed(() => daysUntilLabel(inst.value.dueDate))

function handleClick() {
  if (!hasPending.value) {
    emit('toggle')
  }
}
</script>

<template>
  <div
    class="w-full text-left p-4 rounded-lg border-2 transition-all duration-150"
    :class="[
      hasPending
        ? 'border-primary-200 dark:border-primary-800 bg-primary-50/50 dark:bg-primary-900/10 opacity-80'
        : selected
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-600'
    ]"
  >
    <button
      type="button"
      class="w-full text-left"
      :disabled="hasPending"
      :aria-pressed="!hasPending ? selected : undefined"
      @click="handleClick"
    >
      <div class="flex items-center justify-between gap-3">
        <!-- Left: checkbox icon + info -->
        <div class="flex items-center gap-3 min-w-0">
          <div
            class="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors"
            :class="[
              hasPending
                ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800'
                : selected
                  ? 'border-primary-500 bg-primary-500 text-white'
                  : 'border-gray-300 dark:border-gray-600'
            ]"
          >
            <UIcon
              v-if="selected && !hasPending"
              name="i-lucide-check"
              class="w-3 h-3"
            />
            <UIcon
              v-else-if="hasPending"
              name="i-lucide-minus"
              class="w-3 h-3 text-gray-400"
            />
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {{ inst.subscriptionName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Parcela {{ inst.installmentNumber }} de {{ inst.totalInstallments }}
              · {{ inst.planTitle }}
            </p>
          </div>
        </div>

        <!-- Right: amount + status badge -->
        <div class="flex items-center gap-3 shrink-0">
          <div class="text-right">
            <p class="text-base font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(inst.amountCents) }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ formatDate(inst.dueDate + 'T00:00:00') }}
              <span v-if="dueDateLabel"> · {{ dueDateLabel }}</span>
            </p>
          </div>
          <UBadge
            :color="statusConfig.color"
            variant="subtle"
            size="sm"
          >
            {{ statusConfig.label }}
          </UBadge>
        </div>
      </div>
    </button>

    <!-- Pending payment message + action -->
    <div
      v-if="hasPending"
      class="mt-3 pt-3 border-t border-primary-200 dark:border-primary-800 flex items-center justify-between gap-2"
    >
      <p class="text-xs text-primary-700 dark:text-primary-300">
        Já existe um pagamento em processamento para este item.
      </p>
      <UButton
        variant="link"
        size="xs"
        color="info"
        icon="i-lucide-eye"
        @click.stop="emit('view-pending', inst.pendingPaymentId!)"
      >
        Ver pagamento
      </UButton>
    </div>
  </div>
</template>
