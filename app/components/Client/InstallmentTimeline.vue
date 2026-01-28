<script setup lang="ts">
/**
 * InstallmentTimeline component.
 * Displays installment history with status indicators.
 */

interface Installment {
  id: string
  dueDate: string
  amountCents: number
  status: 'paid' | 'pending' | 'overdue'
  paidAt: string | null
}

defineProps<{
  installments: Installment[]
}>()

const { formatCurrency, formatDate } = useCurrency()

function getStatusColor(status: Installment['status']): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'pending':
      return 'warning'
    case 'overdue':
      return 'error'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: Installment['status']): string {
  switch (status) {
    case 'paid':
      return 'Pago'
    case 'pending':
      return 'Pendente'
    case 'overdue':
      return 'Atrasado'
    default:
      return status
  }
}

function getStatusIcon(status: Installment['status']): string {
  switch (status) {
    case 'paid':
      return 'i-lucide-check-circle'
    case 'pending':
      return 'i-lucide-clock'
    case 'overdue':
      return 'i-lucide-alert-circle'
    default:
      return 'i-lucide-circle'
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Histórico de Parcelas
      </h3>
    </template>

    <div class="space-y-4">
      <div
        v-for="installment in installments"
        :key="installment.id"
        class="flex items-center gap-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div class="shrink-0">
          <UIcon
            :name="getStatusIcon(installment.status)"
            class="w-6 h-6"
            :class="{
              'text-green-500': installment.status === 'paid',
              'text-yellow-500': installment.status === 'pending',
              'text-red-500': installment.status === 'overdue'
            }"
          />
        </div>

        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ formatCurrency(installment.amountCents) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Vencimento: {{ formatDate(installment.dueDate) }}
            <span v-if="installment.paidAt">
              • Pago em: {{ formatDate(installment.paidAt) }}
            </span>
          </p>
        </div>

        <UBadge
          :color="getStatusColor(installment.status)"
          variant="subtle"
        >
          {{ getStatusLabel(installment.status) }}
        </UBadge>
      </div>

      <p
        v-if="installments.length === 0"
        class="text-center text-gray-500 dark:text-gray-400 py-4"
      >
        Nenhuma parcela encontrada.
      </p>
    </div>
  </UCard>
</template>
