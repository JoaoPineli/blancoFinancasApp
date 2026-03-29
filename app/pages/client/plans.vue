<script setup lang="ts">
/**
 * Client Plans page — "Minhas Poupanças".
 * Displays user's plan subscriptions with summary + details hierarchy.
 *
 * Expand/collapse: Option B — only one card expanded at a time.
 * Rationale: Reduces cognitive load when reviewing multiple subscriptions
 * sequentially. Natural accordion pattern. No localStorage overhead.
 *
 * Modal logic is delegated to ClientNewSubscriptionModal component.
 * All financial values come from the backend (no calculations here).
 */
import type { SubscriptionAction } from '~/components/Client/SubscriptionCard.vue'
import { SORT_OPTIONS, type SortOption, type ViewMode } from '~/composables/useSubscriptionHelpers'

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const {
  subscriptions,
  isLoading,
  error,
  fetchSubscriptions,
  renameSubscription
} = useSubscriptionsApi()
const { sortSubscriptions } = useSubscriptionHelpers()

// --- View mode & Sort controls ---
const viewMode = ref<ViewMode>('compact')
const sortBy = ref<SortOption>('next-due')

const sortedSubscriptions = computed(() =>
  sortSubscriptions(subscriptions.value, sortBy.value)
)

// --- Accordion: only one card expanded at a time ---
const expandedId = ref<string | null>(null)
function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

// --- Modals ---
const showModal = ref(false)
const activateSubscriptionId = ref<string | undefined>(undefined)

function openModal() {
  activateSubscriptionId.value = undefined
  showModal.value = true
}

// Rename modal
const renameModal = ref<{ open: boolean, subscriptionId: string, currentName: string }>({
  open: false,
  subscriptionId: '',
  currentName: ''
})

async function handleRenameSubmit(payload: { subscriptionId: string, name: string }) {
  const result = await renameSubscription(payload.subscriptionId, payload.name)
  if (result) {
    renameModal.value.open = false
    toast.add({
      title: 'Nome alterado',
      description: `Poupança renomeada para "${result.name}".`,
      color: 'success'
    })
  }
}

function handleSubscriptionCreated(data: { planTitle: string, name: string }) {
  toast.add({
    title: 'Assinatura criada!',
    description: `Assinatura "${data.name || data.planTitle}" criada com sucesso.`,
    color: 'success'
  })
  fetchSubscriptions()
}

function handleModalClose() {
  activateSubscriptionId.value = undefined
  showModal.value = false
}

// --- Subscription actions ---
function handleAction(action: SubscriptionAction) {
  if (action.type === 'rename') {
    const sub = subscriptions.value.find(s => s.id === action.subscriptionId)
    renameModal.value = {
      open: true,
      subscriptionId: action.subscriptionId,
      currentName: sub?.name || sub?.planTitle || ''
    }
    return
  }

  if (action.type === 'pay') {
    navigateTo({
      path: '/client/finance',
      query: { subscription: action.subscriptionId, tab: 'pay' }
    })
    return
  }

  if (action.type === 'withdraw') {
    navigateTo({
      path: '/client/finance',
      query: { subscription: action.subscriptionId, tab: 'withdraw' }
    })
    return
  }

  if (action.type === 'history') {
    navigateTo({
      path: '/client/finance',
      query: { tab: 'history', subscription: action.subscriptionId }
    })
    return
  }

  if (action.type === 'activate') {
    activateSubscriptionId.value = action.subscriptionId
    showModal.value = true
    return
  }

  // terminate — mock for now
  toast.add({
    title: 'Cancelar plano',
    description: 'Função ainda não implementada.',
    color: 'info'
  })
}

onMounted(() => {
  fetchSubscriptions()
})
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <!-- Page header -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Minhas Poupanças
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gerencie suas assinaturas de planos de poupança.
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        @click="openModal"
      >
        Nova Poupança
      </UButton>
    </div>

    <!-- Toolbar: View mode toggle + Sort (only when there are subscriptions) -->
    <div
      v-if="subscriptions.length > 0 && !isLoading"
      class="flex flex-wrap items-center justify-between gap-3"
    >
      <!-- View mode toggle -->
      <div
        class="inline-flex rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        role="radiogroup"
        aria-label="Modo de visualização"
      >
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="viewMode === 'compact'
            ? 'bg-primary-500 text-white'
            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
          role="radio"
          :aria-checked="viewMode === 'compact'"
          @click="viewMode = 'compact'"
        >
          <UIcon
            name="i-lucide-list"
            class="w-4 h-4 mr-1 align-middle"
            aria-hidden="true"
          />
          Compacto
        </button>
        <button
          type="button"
          class="px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          :class="viewMode === 'detailed'
            ? 'bg-primary-500 text-white'
            : 'bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
          role="radio"
          :aria-checked="viewMode === 'detailed'"
          @click="viewMode = 'detailed'"
        >
          <UIcon
            name="i-lucide-layout-grid"
            class="w-4 h-4 mr-1 align-middle"
            aria-hidden="true"
          />
          Detalhado
        </button>
      </div>

      <!-- Sort dropdown -->
      <div class="flex items-center gap-2">
        <label
          for="sort-select"
          class="text-sm text-gray-500 dark:text-gray-400"
        >Ordenar:</label>
        <USelect
          id="sort-select"
          v-model="sortBy"
          :items="SORT_OPTIONS"
          class="w-48"
        />
      </div>
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
      role="status"
      aria-label="Carregando assinaturas"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary-500"
        aria-hidden="true"
      />
      <span class="ml-2 text-gray-500">Carregando assinaturas...</span>
    </div>

    <!-- Error state -->
    <UCard
      v-else-if="error"
      class="border-red-200 dark:border-red-800"
    >
      <div class="flex items-center gap-3 text-red-600 dark:text-red-400">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-5 h-5"
          aria-hidden="true"
        />
        <span>{{ error }}</span>
        <UButton
          variant="soft"
          size="sm"
          @click="fetchSubscriptions"
        >
          Tentar novamente
        </UButton>
      </div>
    </UCard>

    <!-- Empty state -->
    <UCard v-else-if="subscriptions.length === 0">
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 mx-auto text-gray-400 mb-4"
          aria-hidden="true"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma poupança encontrada
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Você ainda não possui nenhuma assinatura de plano. Clique abaixo para começar.
        </p>
        <UButton
          icon="i-lucide-plus"
          @click="openModal"
        >
          Criar Primeira Poupança
        </UButton>
      </div>
    </UCard>

    <!-- Subscriptions: DETAILED view -->
    <div
      v-else-if="viewMode === 'detailed'"
      class="grid grid-cols-1 gap-6"
    >
      <ClientSubscriptionCard
        v-for="sub in sortedSubscriptions"
        :key="sub.id"
        :subscription="sub"
        :expanded="expandedId === sub.id"
        @toggle-expand="toggleExpand(sub.id)"
        @action="handleAction"
      />
    </div>

    <!-- Subscriptions: COMPACT view -->
    <div
      v-else
      class="space-y-2"
      role="list"
      aria-label="Lista compacta de assinaturas"
    >
      <ClientSubscriptionCompactRow
        v-for="sub in sortedSubscriptions"
        :key="sub.id"
        :subscription="sub"
        @action="handleAction"
      />
    </div>

    <!-- Contract section -->
    <!-- <UCard v-if="subscriptions.length > 0">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-file-text"
            class="w-5 h-5 text-primary-500"
            aria-hidden="true"
          />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Seu Contrato
          </h2>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Você possui um contrato ativo com a Blanco Finanças. Clique no botão abaixo para visualizar
          ou baixar uma cópia do seu contrato.
        </p>

        <UButton
          icon="i-lucide-download"
          variant="soft"
          @click="toast.add({ title: 'Download', description: 'Função de download de contrato ainda não implementada.', color: 'info' })"
        >
          Baixar Contrato (PDF)
        </UButton>
      </div>
    </UCard> -->

    <!-- FAQ -->
    <!-- <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Perguntas Frequentes
        </h2>
      </template>

      <UAccordion
        :items="[
          {
            label: 'Como funciona o rendimento?',
            content: 'O rendimento é calculado mensalmente sobre o valor investido e creditado automaticamente na sua conta. Todos os valores são fornecidos pelo sistema.'
          },
          {
            label: 'Posso ter mais de uma poupança?',
            content: 'Sim! Você pode criar quantas assinaturas quiser, inclusive múltiplas do mesmo plano com parâmetros diferentes.'
          },
          {
            label: 'Qual o prazo para saque?',
            content: 'Saques são processados em até 3 dias úteis após a aprovação. Verifique as condições do seu plano para conhecer eventuais restrições.'
          }
        ]"
      />
    </UCard> -->

    <!-- New subscription modal -->
    <ClientNewSubscriptionModal
      v-model:open="showModal"
      :activate-subscription-id="activateSubscriptionId"
      @created="handleSubscriptionCreated"
      @close="handleModalClose"
    />

    <!-- Rename modal -->
    <ClientSubscriptionRenameModal
      v-model:open="renameModal.open"
      :subscription-id="renameModal.subscriptionId"
      :current-name="renameModal.currentName"
      @save="handleRenameSubmit"
    />
  </div>
</template>
