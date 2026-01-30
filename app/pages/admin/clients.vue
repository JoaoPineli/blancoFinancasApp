<script setup lang="ts">
/**
 * Admin Clients page.
 * Client management with search and filtering.
 */

definePageMeta({
  middleware: ['auth']
})

const { clients } = useMockData()
const { planSummaries, fetchPlanSummaries, isLoading: isPlansLoading } = usePlansApi()
const toast = useToast()

// Modal state
const isAddClientModalOpen = ref(false)

function handleViewClient(clientId: string) {
  toast.add({
    title: 'Visualizar cliente',
    description: `Abrindo detalhes do cliente ${clientId}. (Mock)`,
    color: 'info'
  })
}

interface NewClientFormData {
  name: string
  email: string
  planId: string
}

function handleAddClient(data: NewClientFormData) {
  toast.add({
    title: 'Cliente adicionado',
    description: `Cliente ${data.name} cadastrado com sucesso. (Mock)`,
    color: 'success'
  })
  isAddClientModalOpen.value = false
}

const totalClients = computed(() => clients.length)
const activeClients = computed(() => clients.filter(c => c.status === 'active').length)
const defaultingClients = computed(() => clients.filter(c => c.status === 'defaulting').length)

watch(isAddClientModalOpen, async (open) => {
  if (open) {
    await fetchPlanSummaries()
  }
})
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

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <UIcon
              name="i-lucide-users"
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ totalClients }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <UIcon
              name="i-lucide-user-check"
              class="w-5 h-5 text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Ativos
            </p>
            <p class="text-xl font-semibold text-green-600 dark:text-green-400">
              {{ activeClients }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
            <UIcon
              name="i-lucide-user-x"
              class="w-5 h-5 text-gray-600 dark:text-gray-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Inativos
            </p>
            <p class="text-xl font-semibold text-gray-600 dark:text-gray-400">
              {{ totalClients - activeClients - defaultingClients }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-5 h-5 text-red-600 dark:text-red-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Inadimplentes
            </p>
            <p class="text-xl font-semibold text-red-600 dark:text-red-400">
              {{ defaultingClients }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Client Table -->
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Clientes
          </h2>
          <UButton
            color="primary"
            variant="solid"
            :loading="isPlansLoading"
            @click="isAddClientModalOpen = true"
          >
            <UIcon
              name="i-lucide-user-plus"
              class="w-4 h-4 mr-2"
            />
            Adicionar Cliente
          </UButton>
        </div>
      </template>

      <AdminClientTable
        :clients="clients"
        @view="handleViewClient"
      />
    </UCard>

    <!-- Add Client Modal -->
    <AdminAddClientModal
      v-model:open="isAddClientModalOpen"
      :plans="planSummaries"
      @submit="handleAddClient"
      @close="isAddClientModalOpen = false"
    />
  </div>
</template>
