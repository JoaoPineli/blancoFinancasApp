<script setup lang="ts">
/**
 * ClientTable component for Admin.
 * Uses UTable (Nuxt UI) with search and filtering.
 * Per guardrails: Read-only views must be visually distinct.
 */

interface Client {
  id: string
  name: string
  email: string
  cpfCnpj: string
  status: 'active' | 'inactive' | 'defaulting'
  totalInvestedCents: number
  joinedAt: string
}

const props = defineProps<{
  clients: Client[]
}>()

const emit = defineEmits<{
  (e: 'view', clientId: string): void
}>()

const { formatCurrency, formatDate } = useCurrency()

// Search and filter state
const search = ref('')
const statusFilter = ref<Client['status'] | 'all'>('all')

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'defaulting', label: 'Inadimplente' }
]

// Filtered clients
const filteredClients = computed(() => {
  let result = props.clients

  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(c => c.status === statusFilter.value)
  }

  // Apply search filter
  if (search.value) {
    const searchLower = search.value.toLowerCase()
    result = result.filter(c =>
      c.name.toLowerCase().includes(searchLower) ||
      c.email.toLowerCase().includes(searchLower) ||
      c.cpfCnpj.includes(search.value)
    )
  }

  return result
})

// Table columns - Nuxt UI v3 uses accessorKey for TanStack Table
const columns = [
  { id: 'name', accessorKey: 'name', header: 'Nome' },
  { id: 'email', accessorKey: 'email', header: 'Email' },
  { id: 'cpfCnpj', accessorKey: 'cpfCnpj', header: 'CPF/CNPJ' },
  { id: 'status', accessorKey: 'status', header: 'Status' },
  { id: 'totalInvestedCents', accessorKey: 'totalInvestedCents', header: 'Total Investido' },
  { id: 'joinedAt', accessorKey: 'joinedAt', header: 'Cliente desde' },
  { id: 'actions', header: 'Ações' }
]

function _getStatusColor(status: Client['status']): string {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'neutral'
    case 'defaulting':
      return 'error'
    default:
      return 'neutral'
  }
}

function _getStatusLabel(status: Client['status']): string {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    case 'defaulting':
      return 'Inadimplente'
    default:
      return status
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Filters -->
    <div class="flex flex-col sm:flex-row gap-4">
      <UInput
        v-model="search"
        placeholder="Buscar por nome, email ou CPF/CNPJ..."
        icon="i-lucide-search"
        class="flex-1"
      />
      <USelect
        v-model="statusFilter"
        :items="statusOptions"
        class="w-full sm:w-48"
      />
    </div>

    <!-- Table -->
    <UTable
      :columns="columns"
      :data="filteredClients"
    >
      <template #name-cell="{ row }">
        <span class="font-medium text-gray-900 dark:text-white">
          {{ row.original.name }}
        </span>
      </template>

      <template #status-cell="{ row }">
        <AdminStatusBadge :status="row.original.status" />
      </template>

      <template #totalInvestedCents-cell="{ row }">
        {{ formatCurrency(row.original.totalInvestedCents) }}
      </template>

      <template #joinedAt-cell="{ row }">
        {{ formatDate(row.original.joinedAt) }}
      </template>

      <template #actions-cell="{ row }">
        <UButton
          icon="i-lucide-eye"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="emit('view', row.original.id)"
        />
      </template>
    </UTable>

    <!-- Empty state -->
    <div v-if="filteredClients.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
      Nenhum cliente encontrado.
    </div>
  </div>
</template>
