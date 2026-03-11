<script setup lang="ts">
/**
 * WithdrawalConfirmationModal — confirms plan withdrawal before executing.
 *
 * Shows the subscription name, withdrawable amount, and early termination
 * warning if applicable. User must explicitly confirm.
 *
 * Per guardrails:
 * - No financial calculations. All data from the backend.
 * - Modal pattern matches existing ConfirmationModal.
 */
import type { WithdrawableSubscription } from '~/composables/useFinanceApi'

const props = defineProps<{
  open: boolean
  subscription: WithdrawableSubscription | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm', subscriptionId: string): void
}>()

const { formatCurrency } = useCurrency()

function handleConfirm() {
  if (props.subscription) {
    emit('confirm', props.subscription.subscriptionId)
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-alert-triangle"
          class="w-5 h-5 text-amber-500"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Confirmar retirada
        </h3>
      </div>
    </template>

    <template #body>
      <div
        v-if="subscription"
        class="space-y-4"
      >
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Você está solicitando a retirada do valor da poupança:
        </p>

        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Poupança</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ subscription.subscriptionName }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Parcelas pagas</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ subscription.depositsPaid }} de {{ subscription.depositCount }}
            </span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor a receber</span>
            <span class="text-base font-bold text-primary-600 dark:text-primary-400">
              {{ formatCurrency(subscription.withdrawableAmountCents) }}
            </span>
          </div>
        </div>

        <!-- Early termination warning -->
        <UAlert
          v-if="subscription.isEarlyTermination"
          icon="i-lucide-alert-triangle"
          color="warning"
          variant="subtle"
          title="Atenção: encerramento antecipado"
          description="Ao confirmar, este plano será encerrado. Essa ação não pode ser desfeita."
        />

        <p class="text-xs text-gray-500 dark:text-gray-400">
          A retirada será processada em até 3 dias úteis após aprovação.
        </p>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="emit('update:open', false)"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :loading="isLoading"
          @click="handleConfirm"
        >
          Confirmar retirada
        </UButton>
      </div>
    </template>
  </UModal>
</template>
