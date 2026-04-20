<script setup lang="ts">
/**
 * Admin Withdrawals page — lists all withdrawal requests.
 *
 * Allows admin to approve (mark as done) or reject (with reason) pending withdrawals.
 * Includes status filter and full history.
 *
 * Per guardrails:
 * - No financial calculations. All data from backend.
 * - All HTTP through useAdminWithdrawalsApi composable.
 */
import type { AdminWithdrawal } from '~/composables/useAdminWithdrawalsApi'

definePageMeta({
  middleware: ['auth']
})

const { formatCurrency, formatDate } = useCurrency()
const { withdrawals, isLoading, isActioning, fetchWithdrawals, approveWithdrawal, rejectWithdrawal } = useAdminWithdrawalsApi()

const statusFilter = ref<string>('')
const rejectModalOpen = ref(false)
const targetWithdrawal = ref<AdminWithdrawal | null>(null)

const statusOptions = [
  { label: 'Pendente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Cancelado', value: 'cancelled' }
]

watch(statusFilter, () => {
  fetchWithdrawals(statusFilter.value || undefined)
})

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    pending: 'Pendente',
    confirmed: 'Confirmado',
    cancelled: 'Cancelado'
  }
  return map[s] || s
}

function statusColor(s: string): 'warning' | 'success' | 'error' | 'neutral' {
  const map: Record<string, 'warning' | 'success' | 'error' | 'neutral'> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'error'
  }
  return map[s] || 'neutral'
}

function pixKeyTypeLabel(t: string | null): string {
  const map: Record<string, string> = {
    cpf: 'CPF',
    email: 'E-mail',
    celular: 'Celular',
    aleatoria: 'Aleatória'
  }
  return t ? (map[t] || t) : '-'
}

async function handleApprove(withdrawal: AdminWithdrawal) {
  const ok = await approveWithdrawal(withdrawal.id)
  if (ok) fetchWithdrawals(statusFilter.value || undefined)
}

function handleRejectClick(withdrawal: AdminWithdrawal) {
  targetWithdrawal.value = withdrawal
  rejectModalOpen.value = true
}

async function handleRejectConfirm(transactionId: string, reason: string) {
  const ok = await rejectWithdrawal(transactionId, reason)
  if (ok) {
    rejectModalOpen.value = false
    targetWithdrawal.value = null
    fetchWithdrawals(statusFilter.value || undefined)
  }
}

onMounted(() => {
  fetchWithdrawals()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Page header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Saques
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gerencie as solicitações de saque dos clientes.
        </p>
      </div>

      <!-- Status filter -->
      <div class="flex items-center gap-2">
        <USelect
          v-model="statusFilter"
          :items="statusOptions"
          placeholder="Todos os status"
          class="w-40"
        />
        <UButton
          color="error"
          variant="outline"
          size="sm"
          @click="statusFilter = ''"
        >
          <UIcon
            name="i-lucide-x"
            class="w-4 h-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <div
        v-for="i in 4"
        :key="i"
        class="h-20 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Empty state -->
    <UCard v-else-if="withdrawals.length === 0">
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-arrow-up-right"
          class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
        />
        <p class="text-gray-500 dark:text-gray-400">
          Nenhum saque encontrado.
        </p>
      </div>
    </UCard>

    <!-- Withdrawals table -->
    <UCard v-else>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="border-b border-gray-200 dark:border-gray-700">
              <th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                Cliente
              </th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                Valor
              </th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                Titular Pix
              </th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                Chave Pix
              </th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                Data
              </th>
              <th class="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">
                Status
              </th>
              <th class="py-3 px-4" />
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="w in withdrawals"
              :key="w.id"
              class="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              <td class="py-3 px-4">
                <p class="font-medium text-gray-900 dark:text-white">
                  {{ w.userName }}
                </p>
              </td>
              <td class="py-3 px-4 font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(w.amountCents) }}
              </td>
              <td class="py-3 px-4 text-gray-700 dark:text-gray-300">
                {{ w.ownerName || '-' }}
              </td>
              <td class="py-3 px-4">
                <div
                  v-if="w.pixKey"
                  class="space-y-0.5"
                >
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ pixKeyTypeLabel(w.pixKeyType) }}
                  </p>
                  <p class="font-mono text-gray-900 dark:text-white text-xs">
                    {{ w.pixKey }}
                  </p>
                </div>
                <span
                  v-else
                  class="text-gray-400 dark:text-gray-500"
                >-</span>
              </td>
              <td class="py-3 px-4 text-gray-500 dark:text-gray-400">
                {{ formatDate(w.createdAt) }}
              </td>
              <td class="py-3 px-4">
                <div class="space-y-1">
                  <UBadge
                    :color="statusColor(w.status)"
                    variant="subtle"
                    size="sm"
                  >
                    {{ statusLabel(w.status) }}
                  </UBadge>
                  <p
                    v-if="w.rejectionReason"
                    class="text-xs text-error-500 dark:text-error-400 max-w-45 truncate"
                    :title="w.rejectionReason"
                  >
                    {{ w.rejectionReason }}
                  </p>
                </div>
              </td>
              <td class="py-3 px-4">
                <div
                  v-if="w.status === 'pending'"
                  class="flex gap-2"
                >
                  <UButton
                    size="xs"
                    color="success"
                    variant="soft"
                    :loading="isActioning"
                    @click="handleApprove(w)"
                  >
                    Confirmar realizado
                  </UButton>
                  <UButton
                    size="xs"
                    color="error"
                    variant="soft"
                    :disabled="isActioning"
                    @click="handleRejectClick(w)"
                  >
                    Recusar
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UCard>

    <!-- Reject modal -->
    <AdminRejectWithdrawalModal
      v-model:open="rejectModalOpen"
      :transaction-id="targetWithdrawal?.id ?? null"
      :is-loading="isActioning"
      @confirm="handleRejectConfirm"
      @cancel="rejectModalOpen = false"
    />
  </div>
</template>
