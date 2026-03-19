<script setup lang="ts">
/**
 * AdminClientTable — renders the paginated client list.
 *
 * Receives already-filtered, already-paginated clients from the page.
 * Does NOT apply any search or filtering internally — the parent page
 * controls search/filter/pagination and passes only the current page's rows.
 *
 * Per guardrails: render-only, emits user intent.
 */

export interface AdminClientRow {
  id: string
  name: string
  email: string
  cpf: string | null
  status: string
  phone: string | null
  totalInvestedCents: number
  createdAt: string
}

const props = defineProps<{
  clients: AdminClientRow[]
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'view', clientId: string): void
}>()

const { formatCurrency, formatDate } = useCurrency()

const columns = [
  { id: 'name', accessorKey: 'name', header: 'Nome' },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'cpf', accessorKey: 'cpf', header: 'CPF' },
  { id: 'status', accessorKey: 'status', header: 'Status' },
  { id: 'totalInvestedCents', accessorKey: 'totalInvestedCents', header: 'Total Investido' },
  { id: 'createdAt', accessorKey: 'createdAt', header: 'Cliente desde' },
  { id: 'actions', header: 'Ações' }
]
</script>

<template>
  <div>
    <!-- Loading skeleton rows -->
    <div
      v-if="isLoading"
      class="space-y-2"
    >
      <div
        v-for="i in 5"
        :key="i"
        class="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Table -->
    <UTable
      v-else
      :columns="columns"
      :data="clients"
    >
      <template #name-cell="{ row }">
        <span class="font-medium text-gray-900 dark:text-white">
          {{ row.original.name }}
        </span>
      </template>

      <template #cpf-cell="{ row }">
        <span class="font-mono text-sm text-gray-600 dark:text-gray-300">
          {{ row.original.cpf ?? '—' }}
        </span>
      </template>

      <template #status-cell="{ row }">
        <AdminStatusBadge :status="row.original.status" class="w-23 justify-center"/>
      </template>

      <template #totalInvestedCents-cell="{ row }">
        <span class="font-medium">
          {{ formatCurrency(row.original.totalInvestedCents) }}
        </span>
      </template>

      <template #createdAt-cell="{ row }">
        {{ formatDate(row.original.createdAt) }}
      </template>

      <template #actions-cell="{ row }">
        <UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Ver detalhes"
          @click="emit('view', row.original.id)"
        />
      </template>
    </UTable>

    <!-- Empty state -->
    <div
      v-if="!isLoading && clients.length === 0"
      class="text-center py-10 text-gray-500 dark:text-gray-400"
    >
      <UIcon
        name="i-lucide-users"
        class="w-10 h-10 mx-auto mb-2 text-gray-300 dark:text-gray-600"
      />
      <p>Nenhum cliente encontrado.</p>
    </div>
  </div>
</template>
