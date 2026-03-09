<script setup lang="ts">
/**
 * NewSubscriptionModal component for Client.
 * Two-phase wizard for creating a new plan subscription:
 * - Phase 1: Target amount and preference input
 * - Phase 2: Recommendation display with adjustable parameters and cost breakdown
 *
 * Per guardrails:
 * - No financial calculations performed here (only simple division for bidirectional binding)
 * - All cost data comes from the backend via composables
 * - Component emits user intent (events), parent handles post-creation logic
 */
import type { FormError } from '@nuxt/ui'
import type { RecommendationApiResponse, CostApiResponse } from '~/composables/useSubscriptionsApi'

const emit = defineEmits<{
  (e: 'created', data: { planTitle: string, name: string }): void
  (e: 'close'): void
}>()

const open = defineModel<boolean>('open', { default: false })

const { formatCurrency } = useCurrency()
const {
  getRecommendation,
  calculateCost,
  createSubscription
} = useSubscriptionsApi()

const modalPhase = ref<'input' | 'recommendation'>('input')
const modalLoading = ref(false)
const modalError = ref<string | null>(null)

// Phase 1: User input
const initialForm = {
  subscriptionName: '',
  targetAmountReais: undefined as number | undefined,
  preference: 'FEWER_PAYMENTS' as 'FEWER_PAYMENTS' | 'LOWER_MONTHLY_AMOUNT',
  depositDayOfMonth: 1
}

const form = reactive({ ...initialForm })

type FormSchema = typeof form

function validateForm(state: Partial<FormSchema>): FormError[] {
  const errors: FormError[] = []
  if (!state.subscriptionName || !state.subscriptionName.trim()) {
    errors.push({ name: 'subscriptionName', message: 'Nome da poupança é obrigatório' })
  }
  if (!state.targetAmountReais || state.targetAmountReais <= 0) {
    errors.push({ name: 'targetAmountReais', message: 'Informe um valor válido' })
  }
  return errors
}

const depositDayOptions = [
  { label: 'Dia 1', value: 1 },
  { label: 'Dia 5', value: 5 },
  { label: 'Dia 10', value: 10 },
  { label: 'Dia 15', value: 15 },
  { label: 'Dia 20', value: 20 },
  { label: 'Dia 25', value: 25 }
]

// Phase 2: Recommendation + adjustment
const recommendation = ref<RecommendationApiResponse | null>(null)
const adjustedDepositCount = ref(0)
const adjustedMonthlyAmountCents = ref(0)
const costBreakdown = ref<CostApiResponse | null>(null)
const adjusting = ref(false)
const limitWarning = ref<string | null>(null)
const isCreating = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

function resetForm() {
  modalPhase.value = 'input'
  modalError.value = null
  Object.assign(form, initialForm)
  recommendation.value = null
  costBreakdown.value = null
  limitWarning.value = null
}

function handleClose() {
  emit('close')
  open.value = false
}

async function handleRecommend() {
  modalLoading.value = true
  modalError.value = null

  const targetAmountCents = Math.round(form.targetAmountReais! * 100)
  const result = await getRecommendation(targetAmountCents, form.preference)

  if (result) {
    recommendation.value = result
    adjustedDepositCount.value = result.deposit_count
    adjustedMonthlyAmountCents.value = result.monthly_amount_cents
    costBreakdown.value = {
      total_cost_cents: result.total_cost_cents,
      admin_tax_value_cents: result.admin_tax_value_cents,
      insurance_cost_cents: result.insurance_cost_cents,
      guarantee_fund_cost_cents: result.guarantee_fund_cost_cents,
      guarantee_fund_percent: result.guarantee_fund_percent,
      monthly_amount_cents: result.monthly_amount_cents,
      deposit_count: result.deposit_count
    }
    limitWarning.value = null
    modalPhase.value = 'recommendation'
  } else {
    modalError.value = 'Nenhum plano viável encontrado para este valor. Tente outro montante.'
  }

  modalLoading.value = false
}

/**
 * When user adjusts deposit_count, recalculate monthly_amount.
 * This is simple arithmetic division (not a financial calculation):
 * monthly = ceil(target / count)
 * Then call backend for the actual cost.
 */
async function handleDepositCountChange(newCount: number) {
  if (!recommendation.value || !form.targetAmountReais) return

  const targetCents = Math.round(form.targetAmountReais * 100)
  const minDuration = recommendation.value.min_duration_months
  const maxDuration = recommendation.value.max_duration_months

  if (newCount < minDuration) {
    limitWarning.value = `Mínimo de ${minDuration} parcelas para este plano.`
    return
  }
  if (maxDuration !== null && newCount > maxDuration) {
    limitWarning.value = `Máximo de ${maxDuration} parcelas para este plano.`
    return
  }

  limitWarning.value = null
  adjustedDepositCount.value = newCount

  const newMonthly = Math.ceil(targetCents / newCount)
  adjustedMonthlyAmountCents.value = newMonthly

  adjusting.value = true
  const cost = await calculateCost(
    recommendation.value.plan_id,
    targetCents,
    newCount,
    newMonthly
  )
  if (cost) {
    costBreakdown.value = cost
  }
  adjusting.value = false
}

/**
 * When user adjusts monthly_amount, recalculate deposit_count.
 * Simple arithmetic: count = ceil(target / monthly)
 * Then call backend for the actual cost.
 */
async function handleMonthlyAmountChange(newMonthlyReais: number) {
  if (!recommendation.value || !form.targetAmountReais) return

  const targetCents = Math.round(form.targetAmountReais * 100)
  const newMonthlyCents = Math.round(newMonthlyReais * 100)

  if (newMonthlyCents <= 0) {
    limitWarning.value = 'O valor mensal deve ser maior que zero.'
    return
  }

  const newCount = Math.ceil(targetCents / newMonthlyCents)
  const minDuration = recommendation.value.min_duration_months
  const maxDuration = recommendation.value.max_duration_months

  if (newCount < minDuration) {
    limitWarning.value = `Este valor mensal resultaria em ${newCount} parcela(s), abaixo do mínimo de ${minDuration}.`
    return
  }
  if (maxDuration !== null && newCount > maxDuration) {
    limitWarning.value = `Este valor mensal resultaria em ${newCount} parcelas, acima do máximo de ${maxDuration}.`
    return
  }

  limitWarning.value = null
  adjustedDepositCount.value = newCount
  adjustedMonthlyAmountCents.value = newMonthlyCents

  adjusting.value = true
  const cost = await calculateCost(
    recommendation.value.plan_id,
    targetCents,
    newCount,
    newMonthlyCents
  )
  if (cost) {
    costBreakdown.value = cost
  }
  adjusting.value = false
}

async function handleConfirmSubscription() {
  if (!recommendation.value || !form.targetAmountReais) return

  isCreating.value = true
  const targetCents = Math.round(form.targetAmountReais * 100)

  const result = await createSubscription(
    recommendation.value.plan_id,
    targetCents,
    adjustedDepositCount.value,
    adjustedMonthlyAmountCents.value,
    form.subscriptionName.trim(),
    form.depositDayOfMonth
  )

  if (result) {
    emit('created', { planTitle: result.planTitle, name: result.name })
    open.value = false
  }

  isCreating.value = false
}
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ modalPhase === 'input' ? 'Nova Poupança' : 'Plano Recomendado' }}
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="handleClose"
            />
          </div>
        </template>

        <UForm
          v-if="modalPhase === 'input'"
          :state="form"
          :validate="validateForm"
          class="space-y-4"
          @submit="handleRecommend"
        >
          <UFormField
            name="subscriptionName"
            label="Nome da poupança"
            required
          >
            <UInput
              v-model="form.subscriptionName"
              type="text"
              placeholder="Ex: Casa própria, Reserva, Viagem…"
              maxlength="120"
              class="w-full"
            />
          </UFormField>

          <UFormField
            name="targetAmountReais"
            label="Quanto deseja poupar? (R$)"
            required
          >
            <UInput
              v-model="form.targetAmountReais"
              type="number"
              placeholder="Ex: 10000"
              :min="1"
              step="0.01"
              class="w-full"
            />
          </UFormField>

          <UFormField
            name="preference"
            label="Sua preferência"
          >
            <URadioGroup
              v-model="form.preference"
              :items="[
                {
                  label: 'Menos parcelas',
                  description: 'Prioriza planos com menor número de parcelas, quitando mais rápido.',
                  value: 'FEWER_PAYMENTS'
                },
                {
                  label: 'Valor mensal menor',
                  description: 'Prioriza planos com parcelas mais acessíveis no dia a dia.',
                  value: 'LOWER_MONTHLY_AMOUNT'
                }
              ]"
            />
          </UFormField>

          <UFormField
            name="depositDayOfMonth"
            label="Dia do depósito mensal"
          >
            <USelectMenu
              v-model="form.depositDayOfMonth"
              :items="depositDayOptions"
              value-key="value"
            />
          </UFormField>

          <p
            v-if="modalError"
            class="text-sm text-red-500"
          >
            {{ modalError }}
          </p>

          <UButton
            type="submit"
            block
            :loading="modalLoading"
          >
            Buscar recomendação
          </UButton>
        </UForm>

        <div
          v-if="modalPhase === 'recommendation' && recommendation"
          class="space-y-4"
        >
          <div class="bg-primary-50 dark:bg-primary-950 rounded-lg p-4">
            <p class="text-sm font-medium text-primary-700 dark:text-primary-300 mb-1">
              Plano recomendado
            </p>
            <p class="text-lg font-bold text-primary-900 dark:text-primary-100">
              {{ recommendation.plan_title }}
            </p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <UFormField
              label="Nº de parcelas"
              :description="`Min: ${recommendation.min_duration_months}${recommendation.max_duration_months ? ` / Max: ${recommendation.max_duration_months}` : ''}`"
            >
              <UInput
                :model-value="adjustedDepositCount"
                type="number"
                :min="recommendation.min_duration_months"
                :max="recommendation.max_duration_months ?? undefined"
                @update:model-value="handleDepositCountChange(Number($event))"
              />
            </UFormField>
            <UFormField label="Valor mensal (R$)">
              <UInput
                :model-value="(adjustedMonthlyAmountCents / 100).toFixed(2)"
                type="number"
                :min="0.01"
                step="0.01"
                @update:model-value="handleMonthlyAmountChange(Number($event))"
              />
            </UFormField>
          </div>

          <div
            v-if="limitWarning"
            class="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400"
          >
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-4 h-4"
            />
            {{ limitWarning }}
          </div>

          <div
            v-if="costBreakdown"
            class="border rounded-lg p-4 space-y-2"
          >
            <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Estimativa de custos
            </h4>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Taxa administrativa</span>
              <span>{{ formatCurrency(costBreakdown.admin_tax_value_cents) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Seguro</span>
              <span>{{ formatCurrency(costBreakdown.insurance_cost_cents) }}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-500">Fundo Garantidor</span>
              <span>{{ formatCurrency(costBreakdown.guarantee_fund_cost_cents) }}</span>
            </div>
            <hr class="my-2">
            <div class="flex justify-between text-sm font-bold">
              <span>Custo total estimado</span>
              <span class="text-orange-600 dark:text-orange-400">
                {{ formatCurrency(costBreakdown.total_cost_cents) }}
              </span>
            </div>
          </div>

          <div
            v-if="adjusting"
            class="flex items-center gap-2 text-sm text-gray-500"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="w-4 h-4 animate-spin"
            />
            Recalculando custos...
          </div>

          <div class="flex gap-2">
            <UButton
              variant="outline"
              block
              @click="modalPhase = 'input'"
            >
              Voltar
            </UButton>
            <UButton
              block
              :loading="isCreating"
              :disabled="adjusting || !!limitWarning"
              @click="handleConfirmSubscription"
            >
              Confirmar Assinatura
            </UButton>
          </div>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
