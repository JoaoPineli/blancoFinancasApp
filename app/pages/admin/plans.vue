<script setup lang="ts">
/**
 * Admin Plans page.
 * Orchestrates UI state and binds composable data to components.
 * Per guardrails:
 * - Backend is the single source of truth
 * - Page emits user intent, composables handle mutations
 * - No business logic or financial calculations here
 */

import type { AdminPlan } from '~/types/admin-plan'
import type { PlanFormData } from '~/components/Admin/AddPlanModal.vue'

definePageMeta({
  middleware: ['auth']
})

const {
  plans,
  sortedPlans,
  isLoading,
  isSearching,
  fetchPlans,
  debouncedSearch,
  createPlan,
  updatePlan,
  deletePlan,
  togglePlanStatus
} = usePlansApi()

// Unified plan modal state: null = closed, 'add' = creating, 'edit' = editing
type PlanModalMode = 'add' | 'edit' | null
const planModalMode = ref<PlanModalMode>(null)
const selectedPlan = ref<AdminPlan | null>(null)

const isPlanModalOpen = computed({
  get: () => planModalMode.value !== null,
  set: (open) => {
    if (!open) closePlanModal()
  }
})

// Confirmation dialog state
type ConfirmAction = { type: 'delete', plan: AdminPlan }
  | { type: 'activate', plan: AdminPlan }
  | { type: 'inactivate', plan: AdminPlan }
  | null

const confirmAction = ref<ConfirmAction>(null)
const isConfirmOpen = computed(() => confirmAction.value !== null)

// Consolidated async action state
type ActionState = 'submitting' | 'deleting' | 'toggling' | null
const actionState = ref<ActionState>(null)

// Search input (raw value, composable handles debounce)
const searchInput = ref('')

watch(searchInput, (value) => {
  debouncedSearch(value)
})

onMounted(() => {
  fetchPlans()
})

// Stats derived from composable state
const totalPlans = computed(() => plans.value.length)
const activePlans = computed(() => plans.value.filter(p => p.active).length)

// Plan modal handlers
function openAddModal() {
  selectedPlan.value = null
  planModalMode.value = 'add'
}

function openEditModal(plan: AdminPlan) {
  selectedPlan.value = plan
  planModalMode.value = 'edit'
}

function closePlanModal() {
  planModalMode.value = null
  selectedPlan.value = null
}

async function handlePlanSubmit(data: PlanFormData) {
  actionState.value = 'submitting'

  const result = planModalMode.value === 'edit' && selectedPlan.value
    ? await updatePlan(selectedPlan.value.id, data)
    : await createPlan(data)

  actionState.value = null

  if (result) {
    closePlanModal()
  }
}

// Confirmation dialog handlers
function requestDelete(plan: AdminPlan) {
  confirmAction.value = { type: 'delete', plan }
}

function requestActivate(plan: AdminPlan) {
  confirmAction.value = { type: 'activate', plan }
}

function requestInactivate(plan: AdminPlan) {
  confirmAction.value = { type: 'inactivate', plan }
}

function cancelConfirm() {
  confirmAction.value = null
}

async function executeConfirm() {
  if (!confirmAction.value) return

  const action = confirmAction.value

  if (action.type === 'delete') {
    actionState.value = 'deleting'
    await deletePlan(action.plan.id)
  } else {
    actionState.value = 'toggling'
    await togglePlanStatus(action.plan.id, action.type === 'activate')
  }

  actionState.value = null
  confirmAction.value = null
}

// Confirmation modal computed props
const confirmModalProps = computed(() => {
  const action = confirmAction.value
  if (!action) {
    return {
      title: '',
      description: '',
      message: '',
      confirmLabel: '',
      confirmColor: 'primary' as const,
      icon: 'i-lucide-alert-triangle',
      iconColorClass: '',
      iconBgClass: ''
    }
  }

  const planTitle = action.plan.title

  if (action.type === 'delete') {
    return {
      title: 'Deletar Plano',
      description: 'Esta ação não pode ser desfeita.',
      message: `Tem certeza que deseja deletar o plano <strong class="text-gray-900 dark:text-white">"${planTitle}"</strong>?`,
      confirmLabel: 'Deletar',
      confirmColor: 'error' as const,
      icon: 'i-lucide-alert-triangle',
      iconColorClass: 'text-red-600 dark:text-red-400',
      iconBgClass: 'bg-red-100 dark:bg-red-900/30'
    }
  }

  if (action.type === 'activate') {
    return {
      title: 'Ativar Plano',
      description: 'O plano ficará disponível para novos contratos.',
      message: `Tem certeza que deseja <strong class="text-gray-900 dark:text-white">ativar</strong> o plano <strong class="text-gray-900 dark:text-white">"${planTitle}"</strong>?`,
      confirmLabel: 'Ativar',
      confirmColor: 'success' as const,
      icon: 'i-lucide-check-circle',
      iconColorClass: 'text-green-600 dark:text-green-400',
      iconBgClass: 'bg-green-100 dark:bg-green-900/30'
    }
  }

  return {
    title: 'Inativar Plano',
    description: 'O plano deixará de estar disponível para novos contratos.',
    message: `Tem certeza que deseja <strong class="text-gray-900 dark:text-white">inativar</strong> o plano <strong class="text-gray-900 dark:text-white">"${planTitle}"</strong>?`,
    confirmLabel: 'Inativar',
    confirmColor: 'warning' as const,
    icon: 'i-lucide-ban',
    iconColorClass: 'text-amber-700 dark:text-amber-400',
    iconBgClass: 'bg-amber-100 dark:bg-amber-900/30'
  }
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gerenciamento de Planos
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Visualize e gerencie os planos de investimento disponíveis.
        </p>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <UIcon
              name="i-lucide-layers"
              class="w-5 h-5 text-blue-600 dark:text-blue-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Total de Planos
            </p>
            <p class="text-xl font-semibold text-gray-900 dark:text-white">
              {{ totalPlans }}
            </p>
          </div>
        </div>
      </UCard>

      <UCard>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
            <UIcon
              name="i-lucide-check-circle"
              class="w-5 h-5 text-green-600 dark:text-green-400"
            />
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Planos Ativos
            </p>
            <p class="text-xl font-semibold text-green-600 dark:text-green-400">
              {{ activePlans }}
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Search and Add Button -->
    <UCard>
      <template #header>
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Lista de Planos
          </h2>
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <UInput
              v-model="searchInput"
              placeholder="Buscar por título..."
              icon="i-lucide-search"
              :loading="isSearching"
              class="w-full sm:w-64"
            />
            <UButton
              color="primary"
              variant="solid"
              @click="openAddModal"
            >
              <UIcon
                name="i-lucide-plus"
                class="w-4 h-4 mr-2"
              />
              Adicionar Plano
            </UButton>
          </div>
        </div>
      </template>

      <!-- Loading State -->
      <div
        v-if="isLoading && plans.length === 0"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-8 h-8 text-primary-500 animate-spin"
        />
      </div>

      <!-- Plan Cards Grid -->
      <div
        v-else-if="sortedPlans.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <AdminPlanCard
          v-for="plan in sortedPlans"
          :key="plan.id"
          :plan="plan"
          @click="openEditModal"
          @delete="requestDelete"
          @activate="requestActivate"
          @inactivate="requestInactivate"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="flex flex-col items-center justify-center py-12 text-center"
      >
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 text-gray-400 mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhum plano encontrado
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          {{ searchInput ? 'Tente uma busca diferente.' : 'Adicione um novo plano para começar.' }}
        </p>
        <UButton
          v-if="!searchInput"
          color="primary"
          @click="openAddModal"
        >
          <UIcon
            name="i-lucide-plus"
            class="w-4 h-4 mr-2"
          />
          Adicionar Primeiro Plano
        </UButton>
      </div>
    </UCard>

    <!-- Plan Modal (Add/Edit) -->
    <AdminAddPlanModal
      v-model:open="isPlanModalOpen"
      :plan="planModalMode === 'edit' ? selectedPlan : null"
      :loading="actionState === 'submitting'"
      @submit="handlePlanSubmit"
      @close="closePlanModal"
    />

    <!-- Confirmation Modal -->
    <AdminConfirmationModal
      :open="isConfirmOpen"
      :title="confirmModalProps.title"
      :description="confirmModalProps.description"
      :message="confirmModalProps.message"
      :confirm-label="confirmModalProps.confirmLabel"
      :confirm-color="confirmModalProps.confirmColor"
      :icon="confirmModalProps.icon"
      :icon-color-class="confirmModalProps.iconColorClass"
      :icon-bg-class="confirmModalProps.iconBgClass"
      :loading="actionState === 'deleting' || actionState === 'toggling'"
      @update:open="(v) => { if (!v) cancelConfirm() }"
      @confirm="executeConfirm"
      @cancel="cancelConfirm"
    />
  </div>
</template>
