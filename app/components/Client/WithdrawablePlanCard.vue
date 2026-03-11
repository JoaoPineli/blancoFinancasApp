<script setup lang="ts">
/**
 * WithdrawablePlanCard — shows a subscription eligible for value withdrawal.
 *
 * Used in the "Retirar valor" tab. Shows plan progress and withdrawable amount.
 * Early termination warnings are displayed when applicable.
 *
 * Per guardrails:
 * - No financial calculations. Withdrawable amount comes from the backend.
 * - Component emits intent — parent handles withdrawal requests.
 */
import type { WithdrawableSubscription } from '~/composables/useFinanceApi'

const props = defineProps<{
  subscription: WithdrawableSubscription
}>()

const emit = defineEmits<{
  (e: 'withdraw', subscriptionId: string): void
}>()

const { formatCurrency, formatDate } = useCurrency()

const sub = computed(() => props.subscription)

const statusConfig = computed(() => {
  if (sub.value.status === 'completed') {
    return { label: 'Concluído', color: 'success' as const }
  }
  return { label: 'Ativa', color: 'success' as const }
})

const progressPercent = computed(() => {
  if (sub.value.depositCount === 0) return 0
  return Math.round((sub.value.depositsPaid / sub.value.depositCount) * 100)
})
</script>

<template>
  <UCard>
    <div class="space-y-4">
      <!-- Header: name + status -->
      <div class="flex items-center justify-between gap-2">
        <div class="min-w-0">
          <h4 class="text-base font-semibold text-gray-900 dark:text-white truncate">
            {{ sub.subscriptionName }}
          </h4>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ sub.planTitle }} · Criado em {{ formatDate(sub.createdAt) }}
          </p>
        </div>
        <UBadge
          :color="statusConfig.color"
          variant="subtle"
        >
          {{ statusConfig.label }}
        </UBadge>
      </div>

      <!-- Progress -->
      <div>
        <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>{{ sub.depositsPaid }} de {{ sub.depositCount }} parcelas pagas</span>
          <span>{{ progressPercent }}%</span>
        </div>
        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            class="h-2 rounded-full transition-all duration-300"
            :class="sub.status === 'completed' ? 'bg-green-500' : 'bg-primary-500'"
            :style="{ width: `${progressPercent}%` }"
          />
        </div>
      </div>

      <!-- Withdrawable amount -->
      <div class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
        <div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Valor disponível para retirada
          </p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ formatCurrency(sub.withdrawableAmountCents) }}
          </p>
        </div>
        <UButton
          color="primary"
          variant="soft"
          size="sm"
          @click="emit('withdraw', sub.subscriptionId)"
        >
          Retirar valor
        </UButton>
      </div>

      <!-- Early termination warning -->
      <UAlert
        v-if="sub.isEarlyTermination"
        icon="i-lucide-alert-triangle"
        color="warning"
        variant="subtle"
        title="Encerramento antecipado"
        description="Ao retirar o valor, este plano será encerrado antes do prazo final."
      />
    </div>
  </UCard>
</template>
