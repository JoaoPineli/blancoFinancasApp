<script setup lang="ts">
/**
 * Admin Finance page.
 * Cash flow, conciliation, and Fundo de proteção metrics.
 * Per guardrails: All values from backend, no calculations.
 */

definePageMeta({
  middleware: ['auth']
})

const {
  summary,
  cashFlow,
  cashFlowTotal,
  isLoadingSummary,
  isLoadingCashFlow,
  summaryError,
  cashFlowError,
  fetchSummary,
  fetchCashFlow,
  fetchReconciliation
} = useAdminFinanceApi()

// --- Filter options ---
const CATEGORY_OPTIONS = [
  { label: 'Depósito', value: 'deposit' },
  { label: 'Taxa de Ativação', value: 'activation' },
  { label: 'Saque', value: 'withdrawal' },
  { label: 'Rendimento', value: 'yield' },
  { label: 'Taxa', value: 'fee' },
  { label: 'Fundo de proteção', value: 'fundo_garantidor' }
]

const FLOW_TYPE_OPTIONS = [
  { label: 'Entradas', value: 'inflow' },
  { label: 'Saídas', value: 'outflow' }
]

// --- Date range (default: start of current month → today) ---
const today = new Date()
const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

function toIsoDate(d: Date): string {
  return d.toISOString().split('T')[0] || ''
}

const DEFAULT_START = toIsoDate(firstOfMonth)
const DEFAULT_END = toIsoDate(today)

// Draft filters (while editing) — applied on "Aplicar"
const draftStart = ref<string>(DEFAULT_START)
const draftEnd = ref<string>(DEFAULT_END)
const draftCategory = ref<string>('')
const draftFlowType = ref<string>('')

// Applied filters (what's actually in effect)
const appliedStart = ref<string>(DEFAULT_START)
const appliedEnd = ref<string>(DEFAULT_END)
const appliedCategory = ref<string>('')
const appliedFlowType = ref<string>('')

const isApplying = computed(() => isLoadingSummary.value || isLoadingCashFlow.value)

async function applyFilters() {
  appliedStart.value = draftStart.value
  appliedEnd.value = draftEnd.value
  appliedCategory.value = draftCategory.value
  appliedFlowType.value = draftFlowType.value

  await Promise.all([
    fetchSummary(appliedStart.value, appliedEnd.value, appliedCategory.value || undefined, appliedFlowType.value || undefined),
    fetchCashFlow(appliedStart.value, appliedEnd.value, 1, 50, appliedCategory.value || undefined, appliedFlowType.value || undefined)
  ])
}

function clearFilters() {
  draftStart.value = DEFAULT_START
  draftEnd.value = DEFAULT_END
  draftCategory.value = ''
  draftFlowType.value = ''
  applyFilters()
}

// --- Active filter chips ---
const activeChips = computed(() => {
  const chips: Array<{ label: string, key: string }> = []

  const catOption = CATEGORY_OPTIONS.find(o => o.value === appliedCategory.value)
  if (appliedCategory.value && catOption) chips.push({ label: `Categoria: ${catOption.label}`, key: 'category' })

  const typeOption = FLOW_TYPE_OPTIONS.find(o => o.value === appliedFlowType.value)
  if (appliedFlowType.value && typeOption) chips.push({ label: `Tipo: ${typeOption.label}`, key: 'flowType' })

  const isDefaultPeriod = appliedStart.value === DEFAULT_START && appliedEnd.value === DEFAULT_END
  if (!isDefaultPeriod) chips.push({ label: `Período: ${appliedStart.value} → ${appliedEnd.value}`, key: 'period' })

  return chips
})

const hasActiveFilters = computed(() => activeChips.value.length > 0)

function removeChip(key: string) {
  if (key === 'category') {
    draftCategory.value = ''
    appliedCategory.value = ''
  }
  if (key === 'flowType') {
    draftFlowType.value = ''
    appliedFlowType.value = ''
  }
  if (key === 'period') {
    draftStart.value = DEFAULT_START
    draftEnd.value = DEFAULT_END
    appliedStart.value = DEFAULT_START
    appliedEnd.value = DEFAULT_END
  }
  applyFilters()
}

onMounted(() => {
  applyFilters()
  fetchReconciliation()
})

// Adapt summary for AdminFinanceSummary component
const summaryForComponent = computed(() => {
  if (!summary.value) {
    return { fundoGarantidorCents: 0, totalInflowCents: 0, totalOutflowCents: 0, netBalanceCents: 0 }
  }
  return {
    fundoGarantidorCents: summary.value.fundoGarantidorCents,
    totalInflowCents: summary.value.totalInflowCents,
    totalOutflowCents: summary.value.totalOutflowCents,
    netBalanceCents: summary.value.netBalanceCents
  }
})
</script>

<template>
  <div class="space-y-5">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Controle Financeiro
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Acompanhe o fluxo de caixa e métricas financeiras.
      </p>
    </div>
    <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 space-y-3">
      <!-- Controls row -->
      <div class="grid grid-cols-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] gap-2 items-end">
        <!-- Data inicial -->
        <div class="col-span-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Data inicial
          </label>
          <UInput
            v-model="draftStart"
            type="date"
            size="sm"
            class="w-full"
          />
        </div>

        <!-- Data final -->
        <div class="col-span-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Data final
          </label>
          <UInput
            v-model="draftEnd"
            type="date"
            size="sm"
            class="w-full"
          />
        </div>

        <!-- Categoria -->
        <div class="col-span-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Categoria
          </label>
          <USelect
            v-model="draftCategory"
            :items="CATEGORY_OPTIONS"
            size="sm"
            class="w-full"
          />
        </div>

        <!-- Tipo -->
        <div class="col-span-1">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Tipo
          </label>
          <USelect
            v-model="draftFlowType"
            :items="FLOW_TYPE_OPTIONS"
            size="sm"
            class="w-full"
          />
        </div>

        <!-- Action buttons — span full row on mobile -->
        <div class="col-span-2 md:col-span-1 flex items-end gap-2">
          <UButton
            size="sm"
            :loading="isApplying"
            class="flex-1 md:flex-none justify-center"
            @click="applyFilters"
          >
            Aplicar
          </UButton>
          <UButton
            size="sm"
            variant="outline"
            color="error"
            class="flex-1 md:flex-none justify-center"
            @click="clearFilters"
          >
            <UIcon
              name="i-lucide-x"
              class="w-4 h-4"
            />
          </UButton>
        </div>
      </div>

      <!-- Active filter chips -->
      <div
        v-if="hasActiveFilters"
        class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800"
      >
        <span class="text-xs text-gray-400 dark:text-gray-500 mr-1">Filtros ativos:</span>
        <UBadge
          v-for="chip in activeChips"
          :key="chip.key"
          color="primary"
          variant="subtle"
          size="sm"
          class="cursor-pointer gap-1"
          @click="removeChip(chip.key)"
        >
          {{ chip.label }}
          <UIcon
            name="i-lucide-x"
            class="w-3 h-3"
          />
        </UBadge>
      </div>
    </div>

    <!-- Finance Summary cards -->
    <div
      v-if="isLoadingSummary"
      class="flex justify-center py-8"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-6 h-6 animate-spin text-primary-500"
      />
    </div>
    <UAlert
      v-else-if="summaryError"
      icon="i-lucide-alert-circle"
      color="error"
      variant="subtle"
      :title="summaryError"
    />
    <AdminFinanceSummary
      v-else
      :summary="summaryForComponent"
    />

    <!-- Cash Flow table -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Fluxo de Caixa
          <span
            v-if="cashFlowTotal > 0"
            class="ml-2 text-sm font-normal text-gray-500"
          >
            ({{ cashFlowTotal }} transações)
          </span>
        </h2>
      </template>

      <div
        v-if="isLoadingCashFlow"
        class="flex justify-center py-8"
      >
        <UIcon
          name="i-lucide-loader-2"
          class="w-6 h-6 animate-spin text-primary-500"
        />
      </div>
      <UAlert
        v-else-if="cashFlowError"
        icon="i-lucide-alert-circle"
        color="error"
        variant="subtle"
        :title="cashFlowError"
      />
      <p
        v-else-if="cashFlow.length === 0"
        class="text-center py-8 text-gray-500"
      >
        Nenhuma transação no período selecionado.
      </p>
      <AdminCashFlowTable
        v-else
        :entries="cashFlow"
      />
    </UCard>
  </div>
</template>
