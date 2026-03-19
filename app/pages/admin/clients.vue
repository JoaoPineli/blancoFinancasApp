<script setup lang="ts">
/**
 * Admin Clients page.
 * Orchestrates search, filter, pagination, and status changes.
 * All API interactions via useAdminClientsApi composable.
 */

definePageMeta({
  middleware: ['auth']
})

const {
  clients,
  stats,
  total,
  page,
  pageSize,
  isLoading,
  fetchClients,
  changeClientStatus
} = useAdminClientsApi()

// Search / filter state
const searchQuery = ref('')
const statusFilter = ref('')
const isChangingStatus = ref(false)

// Detail modal state
const detailOpen = ref(false)
const selectedClient = computed(
  () => clients.value.find(c => c.id === selectedClientId.value) ?? null
)
const selectedClientId = ref<string | null>(null)

const statusFilterOptions = [
  { label: 'Todos', value: '' },
  { label: 'Ativo', value: 'active' },
  { label: 'Inativo', value: 'inactive' },
  { label: 'Inadimplente', value: 'defaulting' },
  { label: 'Registrado', value: 'registered' }
]

// Debounced search
let searchTimeout: ReturnType<typeof setTimeout> | null = null
function onSearchInput() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    page.value = 1
    loadClients()
  }, 350)
}

function onFilterChange() {
  page.value = 1
  loadClients()
}

function loadClients() {
  fetchClients({
    q: searchQuery.value,
    statusFilter: statusFilter.value || undefined,
    page: page.value,
    pageSize: pageSize.value
  })
}

function handleViewClient(clientId: string) {
  selectedClientId.value = clientId
  detailOpen.value = true
}

async function handleChangeStatus(userId: string, newStatus: string) {
  isChangingStatus.value = true
  const ok = await changeClientStatus(userId, newStatus)
  isChangingStatus.value = false
  if (ok) {
    detailOpen.value = false
    selectedClientId.value = null
    loadClients()
  }
}

const totalPages = computed(() => Math.ceil(total.value / pageSize.value))

function goToPage(p: number) {
  page.value = p
  loadClients()
}

const statCards = computed(() => [
  {
    label: 'Total',
    value: stats.value.total,
    icon: 'i-lucide-users',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30',
    iconColor: 'text-blue-600 dark:text-blue-400',
    valueColor: 'text-gray-900 dark:text-white'
  },
  {
    label: 'Ativos',
    value: stats.value.active,
    icon: 'i-lucide-user-check',
    iconBg: 'bg-green-100 dark:bg-green-900/30',
    iconColor: 'text-green-600 dark:text-green-400',
    valueColor: 'text-green-600 dark:text-green-400'
  },
  {
    label: 'Inativos',
    value: stats.value.inactive,
    icon: 'i-lucide-user-x',
    iconBg: 'bg-gray-100 dark:bg-gray-800',
    iconColor: 'text-gray-600 dark:text-gray-400',
    valueColor: 'text-gray-600 dark:text-gray-400'
  },
  {
    label: 'Inadimplentes',
    value: stats.value.defaulting,
    icon: 'i-lucide-alert-triangle',
    iconBg: 'bg-red-100 dark:bg-red-900/30',
    iconColor: 'text-red-600 dark:text-red-400',
    valueColor: 'text-red-600 dark:text-red-400'
  },
  {
    label: 'Registrados',
    value: stats.value.registered,
    icon: 'i-lucide-user-plus',
    iconBg: 'bg-amber-100 dark:bg-amber-900/30',
    iconColor: 'text-amber-600 dark:text-amber-400',
    valueColor: 'text-amber-600 dark:text-amber-400'
  }
])

onMounted(loadClients)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciamento de Clientes
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Visualize e gerencie todos os clientes da plataforma.
        </p>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 items-stretch">
      <UCard
        v-for="card in statCards"
        :key="card.label"
        class="h-full"
      >
        <div class="flex items-center gap-3">
          <div
            class="flex h-10 w-10 items-center justify-center rounded-lg"
            :class="card.iconBg"
          >
            <UIcon
              :name="card.icon"
              class="w-5 h-5"
              :class="card.iconColor"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ card.label }}
            </p>
            <p
              class="text-xl font-semibold"
              :class="card.valueColor"
            >
              {{ card.value }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Search + filter -->
    <div class="flex flex-col sm:flex-row gap-3">
      <UInput
        v-model="searchQuery"
        placeholder="Buscar por nome, email ou CPF…"
        icon="i-lucide-search"
        class="flex-1"
        @input="onSearchInput"
      />
      <USelect
        v-model="statusFilter"
        :options="statusFilterOptions"
        option-attribute="label"
        value-attribute="value"
        class="sm:w-48"
        @update:model-value="onFilterChange"
      />
    </div>

    <!-- Client table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Clientes
          </h2>
          <span
            v-if="!isLoading"
            class="text-sm text-gray-500 dark:text-gray-400"
          >
            {{ total }} {{ total === 1 ? 'cliente' : 'clientes' }}
          </span>
        </div>
      </template>

      <AdminClientTable
        :clients="clients"
        :is-loading="isLoading"
        @view="handleViewClient"
      />

      <!-- Pagination -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 mt-4"
      >
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Página {{ page }} de {{ totalPages }}
        </p>
        <div class="flex gap-2">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          />
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="page >= totalPages"
            @click="goToPage(page + 1)"
          />
        </div>
      </div>
    </UCard>

    <!-- Client detail modal -->
    <AdminClientDetailModal
      :open="detailOpen"
      :client="selectedClient"
      :is-changing-status="isChangingStatus"
      @update:open="detailOpen = $event"
      @change-status="handleChangeStatus"
    />
  </div>
</template>
