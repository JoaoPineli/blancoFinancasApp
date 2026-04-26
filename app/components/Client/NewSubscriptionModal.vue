<script setup lang="ts">
/**
 * NewSubscriptionModal component for Client.
 * Three-phase wizard for creating a new plan subscription:
 * - Phase 1: Target amount and preference input
 * - Phase 2: Recommendation display with adjustable parameters and cost breakdown
 * - Phase 3: Activation payment (Pix QR code)
 *
 * Can also be opened directly at Phase 3 by passing activateSubscriptionId prop.
 *
 * Per guardrails:
 * - No financial calculations performed here (only simple division for bidirectional binding)
 * - All cost data comes from the backend via composables
 * - Component emits user intent (events), parent handles post-creation logic
 */
import type { FormError } from '@nuxt/ui'
import type { RecommendationApiResponse, CostApiResponse, ActivationPaymentApiResponse } from '~/composables/useSubscriptionsApi'

const props = defineProps<{
  /** When set, modal opens directly at Phase 3 for an existing inactive subscription. */
  activateSubscriptionId?: string
}>()

const emit = defineEmits<{
  (e: 'created', data: { planTitle: string, name: string }): void
  (e: 'close'): void
}>()

const open = defineModel<boolean>('open', { default: false })

const { formatCurrency } = useCurrency()
const {
  getRecommendation,
  calculateCost,
  createSubscription,
  createOrGetActivationPayment,
  getActivationPayment
} = useSubscriptionsApi()

const modalPhase = ref<'input' | 'recommendation' | 'terms' | 'activation-payment'>('input')
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

// Phase 3: Terms acknowledgement
const termsAccepted = ref(false)

// Phase 4: Activation payment (QR code)
const activationPayment = ref<ActivationPaymentApiResponse | null>(null)
const createdSubscriptionId = ref<string | null>(null)
const isLoadingActivation = ref(false)

let pollInterval: ReturnType<typeof setInterval> | null = null

function startPolling() {
  if (pollInterval) return
  pollInterval = setInterval(async () => {
    const subId = createdSubscriptionId.value ?? props.activateSubscriptionId
    if (!subId) return
    const updated = await getActivationPayment(subId)
    if (updated) {
      activationPayment.value = updated
      if (updated.status !== 'pending') stopPolling()
    }
  }, 5000)
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval)
    pollInterval = null
  }
}

const parseUtc = (value: string) =>
  new Date(value.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1') + 'Z')

const pixExpirationDate = computed(() => {
  const createdAt = activationPayment.value?.created_at
  const expirationMinutes = activationPayment.value?.expiration_minutes
  if (!createdAt || expirationMinutes == null) return null
  const date = parseUtc(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getTime() + expirationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})

watch(open, async (isOpen) => {
  if (!isOpen) {
    resetForm()
    return
  }
  // Opened for activating an existing subscription — skip to Phase 3
  if (props.activateSubscriptionId) {
    isLoadingActivation.value = true
    const payment = await createOrGetActivationPayment(props.activateSubscriptionId)
    isLoadingActivation.value = false
    if (payment) {
      activationPayment.value = payment
      modalPhase.value = 'activation-payment'
    }
  }
})

function resetForm() {
  stopPolling()
  modalPhase.value = 'input'
  modalError.value = null
  Object.assign(form, initialForm)
  recommendation.value = null
  costBreakdown.value = null
  limitWarning.value = null
  termsAccepted.value = false
  activationPayment.value = null
  createdSubscriptionId.value = null
}

watch(modalPhase, (phase) => {
  if (phase === 'activation-payment') startPolling()
  else stopPolling()
})

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
    // Emit immediately so the parent list updates before QR code is generated
    emit('created', { planTitle: result.planTitle, name: result.name })
    createdSubscriptionId.value = result.id
    const payment = await createOrGetActivationPayment(result.id)
    if (payment) {
      activationPayment.value = payment
      modalPhase.value = 'activation-payment'
    } else {
      open.value = false
    }
  }

  isCreating.value = false
}

function handleActivationPaymentDone() {
  open.value = false
}

function handleCopyPixCode() {
  if (activationPayment.value?.pix_qr_code_data) {
    navigator.clipboard.writeText(activationPayment.value.pix_qr_code_data)
  }
}
</script>

<template>
  <UModal v-model:open="open">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{
                modalPhase === 'input' ? 'Nova Poupança'
                : modalPhase === 'recommendation' ? 'Plano Recomendado'
                  : modalPhase === 'terms' ? 'Confirmação de Taxa'
                    : 'Ativar Poupança'
              }}
            </h2>
            <UButton
              icon="i-lucide-x"
              variant="ghost"
              size="sm"
              @click="handleClose"
            />
          </div>
        </template>

        <!-- Loading: fetching activation payment for existing subscription -->
        <div
          v-if="isLoadingActivation"
          class="flex flex-col items-center justify-center py-12 gap-3"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="w-8 h-8 animate-spin text-primary-500"
          />
          <p class="text-sm text-gray-500">
            Gerando código de pagamento...
          </p>
        </div>

        <UForm
          v-else-if="modalPhase === 'input'"
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
            <USelect
              v-model="form.depositDayOfMonth"
              :items="depositDayOptions"
            />
          </UFormField>

          <p
            v-if="modalError"
            class="text-sm text-error-500"
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
          v-else-if="modalPhase === 'recommendation' && recommendation"
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
            class="flex items-center gap-2 text-sm text-warning-600 dark:text-warning-400"
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
              <span class="text-gray-500">Fundo de proteção</span>
              <span>{{ formatCurrency(costBreakdown.guarantee_fund_cost_cents) }}</span>
            </div>
            <hr class="my-2">
            <div class="flex justify-between text-sm font-bold">
              <span>Custo total estimado</span>
              <span class="text-warning-600 dark:text-warning-400">
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
              :disabled="adjusting || !!limitWarning"
              @click="modalPhase = 'terms'"
            >
              Revisar taxa de ativação
            </UButton>
          </div>
        </div>

        <!-- Phase 3: Terms acknowledgement -->
        <div
          v-else-if="modalPhase === 'terms'"
          class="space-y-4"
        >
          <!-- What the fee covers -->
          <div class="space-y-2">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">
              Antes de continuar, leia com atenção:
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Para ativar sua poupança, é cobrada uma <strong>taxa única de ativação</strong> via Pix. Ela cobre:
            </p>
            <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4 list-disc">
              <li>Taxa administrativa do plano</li>
              <li>Seguro do primeiro mês</li>
              <li>Taxa de transação Pix (0,99%)</li>
            </ul>
          </div>

          <!-- Non-refundable notice -->
          <div class="flex items-start gap-3 bg-warning-50 dark:bg-warning-950 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
            <UIcon
              name="i-lucide-alert-triangle"
              class="w-5 h-5 text-warning-600 dark:text-warning-400 mt-0.5 shrink-0"
            />
            <div class="space-y-1">
              <p class="text-sm font-semibold text-warning-800 dark:text-warning-200">
                Este valor não é reembolsável
              </p>
              <p class="text-xs text-warning-700 dark:text-warning-400">
                Após a confirmação do pagamento, a taxa de ativação não poderá ser estornada sob nenhuma circunstância.
              </p>
            </div>
          </div>

          <!-- Fundo de proteção notice -->
          <div class="flex items-start gap-3 bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <UIcon
              name="i-lucide-shield-check"
              class="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5 shrink-0"
            />
            <p class="text-xs text-primary-700 dark:text-primary-300">
              O pagamento garante sua entrada no <strong>fundo de proteção</strong>, uma reserva destinada a proteger o seu investimento e cobrir imprevistos durante o período de poupança.
            </p>
          </div>

          <!-- Checkbox acknowledgement -->
          <label class="flex items-start gap-3 cursor-pointer select-none">
            <input
              v-model="termsAccepted"
              type="checkbox"
              class="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 shrink-0"
            >
            <span class="text-sm text-gray-700 dark:text-gray-300">
              Estou ciente que a taxa de ativação <strong>não é reembolsável</strong> e concordo em prosseguir com o pagamento.
            </span>
          </label>

          <div class="flex gap-2">
            <UButton
              variant="outline"
              block
              @click="modalPhase = 'recommendation'"
            >
              Voltar
            </UButton>
            <UButton
              block
              :loading="isCreating"
              :disabled="!termsAccepted"
              @click="handleConfirmSubscription"
            >
              Gerar QR Code
            </UButton>
          </div>
        </div>

        <!-- Phase 4: Activation payment (QR code) -->
        <div
          v-else-if="modalPhase === 'activation-payment' && activationPayment"
          class="space-y-4"
        >
          <!-- Confirmed state -->
          <div
            v-if="activationPayment.status === 'confirmed'"
            class="flex flex-col items-center gap-4 py-6"
          >
            <UIcon
              name="i-lucide-circle-check"
              class="w-16 h-16 text-green-500"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Pagamento confirmado!
            </h3>
            <p class="text-sm text-center text-gray-500 dark:text-gray-400">
              Sua poupança foi ativada com sucesso.
            </p>
            <UButton
              block
              @click="handleActivationPaymentDone"
            >
              Fechar
            </UButton>
          </div>

          <!-- Expired state -->
          <div
            v-else-if="activationPayment.status === 'expired'"
            class="flex flex-col items-center gap-4 py-6"
          >
            <UIcon
              name="i-lucide-clock-alert"
              class="w-16 h-16 text-amber-500"
            />
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              QR Code expirado
            </h3>
            <p class="text-sm text-center text-gray-500 dark:text-gray-400">
              O tempo para pagamento expirou. Feche e abra novamente para gerar um novo código.
            </p>
            <UButton
              block
              variant="outline"
              @click="handleActivationPaymentDone"
            >
              Fechar
            </UButton>
          </div>

          <!-- Pending state: QR code + polling indicator -->
          <template v-else>
            <!-- Fee breakdown -->
            <div class="border rounded-lg p-4 space-y-2">
              <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Taxa de ativação
              </h4>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Taxa administrativa</span>
                <span>{{ formatCurrency(activationPayment.admin_tax_cents) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Seguro</span>
                <span>{{ formatCurrency(activationPayment.insurance_cents) }}</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-500">Taxa Pix (0,99%)</span>
                <span>{{ formatCurrency(activationPayment.pix_transaction_fee_cents) }}</span>
              </div>
              <hr class="my-2">
              <div class="flex justify-between text-sm font-bold">
                <span>Total</span>
                <span class="text-primary-600 dark:text-primary-400">
                  {{ formatCurrency(activationPayment.total_amount_cents) }}
                </span>
              </div>
            </div>

            <!-- PIX QR code -->
            <div
              v-if="activationPayment.pix_qr_code_data"
              class="flex flex-col items-center gap-3 py-2"
            >
              <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
                Escaneie o QR Code para pagar
              </p>
              <div class="bg-white rounded-lg p-3 border">
                <img
                  v-if="activationPayment.pix_qr_code_base64"
                  :src="'data:image/png;base64,' + activationPayment.pix_qr_code_base64"
                  alt="QR Code Pix"
                  width="180"
                  height="180"
                >
                <div
                  v-else
                  class="w-45 h-45 flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-qr-code"
                    class="w-24 h-24 text-gray-400"
                  />
                </div>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                {{ pixExpirationDate ? 'Válido até ' + pixExpirationDate : 'Erro ao calcular data de expiração' }}
              </p>
              <UButton
                variant="outline"
                size="sm"
                icon="i-lucide-copy"
                @click="handleCopyPixCode"
              >
                Copiar código Pix
              </UButton>
            </div>

            <div class="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <UIcon
                name="i-lucide-loader-2"
                class="w-3 h-3 animate-spin"
              />
              Aguardando confirmação do pagamento...
            </div>

            <UButton
              block
              variant="outline"
              @click="handleActivationPaymentDone"
            >
              Fechar e verificar depois
            </UButton>
          </template>
        </div>
      </UCard>
    </template>
  </UModal>
</template>
