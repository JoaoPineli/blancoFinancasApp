<script setup lang="ts">
/**
 * AdminClientDetailModal — shows real client details and status actions.
 *
 * Three status actions available: active, inactive, defaulting.
 * Each requires confirmation via AdminConfirmationModal.
 *
 * Per guardrails:
 * - No API calls. Emits intent to parent.
 * - All values display-only from props.
 */
import type { AdminClient } from '~/composables/useAdminClientsApi'

const props = defineProps<{
  open: boolean
  client: AdminClient | null
  isChangingStatus?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'change-status', userId: string, newStatus: string): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

const { formatCurrency, formatDate } = useCurrency()

// Confirmation modal state
const confirmOpen = ref(false)
const pendingStatus = ref<string | null>(null)

const statusActions: Array<{
  status: string
  label: string
  icon: string
  color: 'success' | 'neutral' | 'error'
  iconColorClass: string
  iconBgClass: string
  confirmLabel: string
  message: (name: string) => string
}> = [
  {
    status: 'active',
    label: 'Marcar como Ativo',
    icon: 'i-lucide-user-check',
    color: 'success',
    iconColorClass: 'text-green-600 dark:text-green-400',
    iconBgClass: 'bg-green-100 dark:bg-green-900/30',
    confirmLabel: 'Ativar',
    message: name => `Tem certeza que deseja marcar <strong>${name}</strong> como <strong>Ativo</strong>?`
  },
  {
    status: 'inactive',
    label: 'Marcar como Inativo',
    icon: 'i-lucide-user-x',
    color: 'neutral',
    iconColorClass: 'text-gray-600 dark:text-gray-400',
    iconBgClass: 'bg-gray-100 dark:bg-gray-800',
    confirmLabel: 'Desativar',
    message: name => `Tem certeza que deseja marcar <strong>${name}</strong> como <strong>Inativo</strong>?`
  },
  {
    status: 'defaulting',
    label: 'Marcar como Inadimplente',
    icon: 'i-lucide-alert-triangle',
    color: 'error',
    iconColorClass: 'text-red-600 dark:text-red-400',
    iconBgClass: 'bg-red-100 dark:bg-red-900/30',
    confirmLabel: 'Confirmar',
    message: name => `Tem certeza que deseja marcar <strong>${name}</strong> como <strong>Inadimplente</strong>?`
  }
]

const currentAction = computed(
  () => statusActions.find(a => a.status === pendingStatus.value) ?? null
)

function requestStatusChange(newStatus: string) {
  pendingStatus.value = newStatus
  confirmOpen.value = true
}

function handleConfirm() {
  if (props.client && pendingStatus.value) {
    emit('change-status', props.client.id, pendingStatus.value)
  }
  confirmOpen.value = false
  pendingStatus.value = null
}

function handleConfirmCancel() {
  confirmOpen.value = false
  pendingStatus.value = null
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard v-if="client">
        <template #header>
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <UIcon
                name="i-lucide-user"
                class="w-5 h-5 text-primary-600 dark:text-primary-400"
              />
            </div>
            <div class="min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {{ client.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                Detalhes do cliente
              </p>
            </div>
          </div>
        </template>

        <!-- Client info grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Email
            </p>
            <p class="mt-0.5 text-sm text-gray-900 dark:text-white break-all">
              {{ client.email }}
            </p>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              CPF
            </p>
            <p class="mt-0.5 text-sm font-mono text-gray-900 dark:text-white">
              {{ client.cpf ?? '—' }}
            </p>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Telefone
            </p>
            <p class="mt-0.5 text-sm text-gray-900 dark:text-white">
              {{ client.phone ?? '—' }}
            </p>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Status
            </p>
            <div class="mt-1">
              <AdminStatusBadge :status="client.status" />
            </div>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Cliente desde
            </p>
            <p class="mt-0.5 text-sm text-gray-900 dark:text-white">
              {{ formatDate(client.createdAt) }}
            </p>
          </div>

          <div>
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              Total investido
            </p>
            <p class="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(client.totalInvestedCents) }}
            </p>
          </div>
        </div>

        <!-- Status actions -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
          <p class="text-sm font-medium text-gray-600 dark:text-gray-300 mb-3">
            Alterar status
          </p>
          <div class="flex flex-wrap gap-2">
            <UButton
              v-for="action in statusActions"
              :key="action.status"
              :color="action.color"
              variant="soft"
              :icon="action.icon"
              :disabled="client.status === action.status || isChangingStatus"
              :loading="isChangingStatus && pendingStatus === action.status"
              size="sm"
              @click="requestStatusChange(action.status)"
            >
              {{ action.label }}
            </UButton>
          </div>
        </div>

        <template #footer>
          <div class="flex justify-end">
            <UButton
              color="neutral"
              variant="outline"
              @click="isOpen = false"
            >
              Fechar
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>

  <!-- Confirmation modal (nested, outside the main modal) -->
  <AdminConfirmationModal
    v-if="currentAction && client"
    :open="confirmOpen"
    :title="currentAction.label"
    :message="currentAction.message(client.name)"
    :confirm-label="currentAction.confirmLabel"
    :confirm-color="currentAction.color"
    :icon="currentAction.icon"
    :icon-color-class="currentAction.iconColorClass"
    :icon-bg-class="currentAction.iconBgClass"
    :loading="isChangingStatus ?? false"
    @update:open="confirmOpen = $event"
    @confirm="handleConfirm"
    @cancel="handleConfirmCancel"
  />
</template>
