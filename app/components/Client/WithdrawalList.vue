<script setup lang="ts">
/**
 * WithdrawalList component.
 * Displays withdrawal requests with status.
 */

interface Withdrawal {
  id: string
  requestedAt: string
  amountCents: number
  status: 'pending' | 'approved' | 'rejected'
  bankName: string
  accountNumber: string
}

defineProps<{
  withdrawals: Withdrawal[]
}>()

const { formatCurrency, formatDate } = useCurrency()

function getStatusColor(status: Withdrawal['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'approved':
      return 'success'
    case 'pending':
      return 'warning'
    case 'rejected':
      return 'error'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: Withdrawal['status']): string {
  switch (status) {
    case 'approved':
      return 'Aprovado'
    case 'pending':
      return 'Pendente'
    case 'rejected':
      return 'Rejeitado'
    default:
      return status
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Solicitações de Saque
      </h3>
    </template>

    <div class="space-y-3">
      <div
        v-for="withdrawal in withdrawals"
        :key="withdrawal.id"
        class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div>
          <p class="font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(withdrawal.amountCents) }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ withdrawal.bankName }} • {{ withdrawal.accountNumber }}
          </p>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            {{ formatDate(withdrawal.requestedAt) }}
          </p>
        </div>

        <UBadge :color="getStatusColor(withdrawal.status)" variant="subtle">
          {{ getStatusLabel(withdrawal.status) }}
        </UBadge>
      </div>

      <p v-if="withdrawals.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-4">
        Nenhuma solicitação de saque encontrada.
      </p>
    </div>
  </UCard>
</template>
