<script setup lang="ts">
/**
 * ClientDashboardPlansCard — top subscriptions section for the dashboard.
 *
 * Shows the first N subscriptions sorted by next due date.
 * Follows the icon + row design pattern of ClientHistoricoParcelasCard.
 *
 * Per guardrails:
 * - No financial calculations. All values come from backend via props.
 */
import type { Subscription } from '~/composables/useSubscriptionsApi'

defineProps<{
  subscriptions: Subscription[]
  isLoading?: boolean
}>()

const { formatDate } = useCurrency()
const { statusLabel, statusColor } = useSubscriptionHelpers()
</script>

<template>
  <UCard class="h-full flex flex-col">
    <template #header>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Meus planos
        </h2>
        <NuxtLink to="/client/plans">
          <UButton
            variant="ghost"
            size="sm"
            trailing-icon="i-lucide-arrow-right"
          >
            Ver todos
          </UButton>
        </NuxtLink>
      </div>
    </template>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="space-y-3"
    >
      <div
        v-for="i in 3"
        :key="i"
        class="h-14 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse"
      />
    </div>

    <!-- Empty state -->
    <div
      v-else-if="subscriptions.length === 0"
      class="text-center py-8 flex-1 flex flex-col items-center justify-center"
    >
      <UIcon
        name="i-lucide-piggy-bank"
        class="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2"
      />
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
        Você ainda não possui planos.
      </p>
      <NuxtLink to="/client/plans">
        <UButton
          size="sm"
          color="primary"
        >
          Criar poupança
        </UButton>
      </NuxtLink>
    </div>

    <!-- Plans list (scrollable) -->
    <div
      v-else
      class="space-y-2 max-h-64 overflow-y-auto pr-1"
    >
      <div
        v-for="sub in subscriptions"
        :key="sub.id"
        class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
      >
        <div class="shrink-0">
          <UIcon
            name="i-lucide-piggy-bank"
            class="w-6 h-6 text-primary-500"
          />
        </div>

        <NuxtLink
          to="/client/plans"
          class="flex-1 min-w-0"
        >
          <div class="flex items-center gap-2 mb-0.5">
            <span class="text-sm font-medium text-gray-900 dark:text-white truncate">
              {{ sub.name || sub.planTitle }}
            </span>
            <UBadge
              :color="statusColor(sub.status)"
              variant="subtle"
              size="xs"
            >
              {{ statusLabel(sub.status) }}
            </UBadge>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            <template v-if="sub.status === 'inactive'">
              Aguardando ativação
            </template>
            <template v-else>
              {{ sub.depositsPaid }}/{{ sub.depositCount }} parcelas · vence {{ sub.nextDueDate ? formatDate(sub.nextDueDate + 'T00:00:00') : '—' }}
            </template>
          </p>
        </NuxtLink>

        <NuxtLink
          v-if="sub.status !== 'inactive'"
          :to="`/client/finance?tab=pay&subscription=${sub.id}`"
        >
          <UButton
            size="xs"
            variant="soft"
            color="primary"
            icon="i-lucide-credit-card"
          >
            Pagar
          </UButton>
        </NuxtLink>
      </div>
    </div>
  </UCard>
</template>
