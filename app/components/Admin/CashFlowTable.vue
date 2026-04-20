<script setup lang="ts">
/**
 * CashFlowTable component for Admin.
 * Displays cash flow entries with inflow/outflow indicators.
 */

interface CashFlowEntry {
  id: string
  date: string
  description: string
  type: 'inflow' | 'outflow'
  amountCents: number
  category: string
}

defineProps<{
  entries: CashFlowEntry[]
}>()

const { formatCurrency, formatDate } = useCurrency()

const columns = [
  { id: 'date', accessorKey: 'date', header: 'Data' },
  { id: 'description', accessorKey: 'description', header: 'Descrição' },
  { id: 'category', accessorKey: 'category', header: 'Categoria' },
  { id: 'type', accessorKey: 'type', header: 'Tipo' },
  { id: 'amountCents', accessorKey: 'amountCents', header: 'Valor' }
]
</script>

<template>
  <UTable
    :columns="columns"
    :data="entries"
  >
    <template #date-cell="{ row }">
      {{ formatDate(row.original.date) }}
    </template>

    <template #type-cell="{ row }">
      <div class="flex items-center gap-2">
        <UIcon
          :name="row.original.type === 'inflow' ? 'i-lucide-arrow-down-left' : 'i-lucide-arrow-up-right'"
          :class="row.original.type === 'inflow' ? 'text-success-500' : 'text-error-500'"
        />
        <span>{{ row.original.type === 'inflow' ? 'Entrada' : 'Saída' }}</span>
      </div>
    </template>

    <template #amountCents-cell="{ row }">
      <span
        :class="row.original.type === 'inflow' ? 'text-success-600 dark:text-success-400' : 'text-error-600 dark:text-error-400'"
        class="font-medium"
      >
        {{ row.original.type === 'inflow' ? '+' : '-' }}{{ formatCurrency(row.original.amountCents) }}
      </span>
    </template>

    <template #category-cell="{ row }">
      <div class="flex justify-center">
        <UBadge
          color="neutral"
          variant="subtle"
          class="w-full justify-center"
        >
          {{ row.original.category }}
        </UBadge>
      </div>
    </template>
  </UTable>
</template>
