<script setup lang="ts">
/**
 * AddPlanModal component for Admin.
 * Modal to add or edit a plan in the system.
 * Per guardrails:
 * - Frontend validation is for UX only, not authoritative
 * - Components emit user intent (events), do not perform business logic
 * - No financial calculations performed here
 *
 * This component uses a 3-step wizard pattern:
 * - Step 1: Identificação (title, description, active)
 * - Step 2: Restrições (value and duration constraints)
 * - Step 3: Parâmetros Financeiros (admin tax, insurance, guarantee fund)
 */

import type { Form, FormError, StepperItem } from '@nuxt/ui'
import type { AdminPlan } from '~/composables/useMockData'

const props = defineProps<{
  plan?: AdminPlan | null
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'submit', data: PlanFormData): void
  (e: 'close'): void
}>()

const open = defineModel<boolean>('open', { default: false })

export interface PlanFormData {
  title: string
  description: string
  active: boolean
  minValueCents: number
  maxValueCents: number | null
  minDurationMonths: number
  maxDurationMonths: number | null
  adminTaxValueCents: number
  insurancePercent: number
  guaranteeFundPercent1: number
  guaranteeFundPercent2: number
  guaranteeFundThresholdCents: number
}

// ========================
// STEPPER STATE
// ========================
const currentStep = ref(0) // 0-indexed: 0 = Step 1, 1 = Step 2, 2 = Step 3

const stepperItems: StepperItem[] = [
  {
    title: 'Identificação',
    description: 'Dados do plano',
    icon: 'i-lucide-tag'
  },
  {
    title: 'Restrições',
    description: 'Valor e duração',
    icon: 'i-lucide-sliders-horizontal'
  },
  {
    title: 'Parâmetros Financeiros',
    description: 'Taxas e fundo garantidor',
    icon: 'i-lucide-calculator'
  }
]

const isEditMode = computed(() => !!props.plan)
const modalTitle = computed(() => isEditMode.value ? 'Editar Plano' : 'Adicionar Novo Plano')
const modalDescription = computed(() =>
  isEditMode.value
    ? 'Atualize as configurações do plano selecionado.'
    : 'Preencha os dados do plano para cadastrá-lo no sistema.'
)
const submitButtonText = computed(() => isEditMode.value ? 'Salvar' : 'Adicionar Plano')

/**
 * Display form uses Reais (R$) for better admin UX.
 * Internal form keeps cents for API submission.
 * Conversion: display = cents / 100, cents = display * 100
 */
interface DisplayForm {
  title: string
  description: string
  active: boolean
  minValue: number
  maxValue: number | null
  minDurationMonths: number
  maxDurationMonths: number | null
  adminTaxValue: number
  insurancePercent: number
  guaranteeFundPercent1: number
  guaranteeFundPercent2: number
  guaranteeFundThreshold: number
}

const displayForm = reactive<DisplayForm>({
  title: '',
  description: '',
  active: true,
  minValue: 0,
  maxValue: null,
  minDurationMonths: 1,
  maxDurationMonths: null,
  adminTaxValue: 0,
  insurancePercent: 0,
  guaranteeFundPercent1: 0,
  guaranteeFundPercent2: 0,
  guaranteeFundThreshold: 0
})

function centsToReais(cents: number): number {
  return cents / 100
}

function reaisToCents(reais: number): number {
  return Math.round(reais * 100)
}

const currencyDisplayStrings = reactive({
  minValue: '',
  maxValue: '',
  adminTaxValue: '',
  guaranteeFundThreshold: ''
})

function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}

function parseBRL(value: string): number {
  if (!value || value.trim() === '') return 0
  // Remove thousand separators (.) and replace decimal comma with dot
  const normalized = value.replace(/\./g, '').replace(',', '.')
  const parsed = parseFloat(normalized)
  return isNaN(parsed) ? 0 : parsed
}

function parseBRLNullable(value: string): number | null {
  if (!value || value.trim() === '') return null
  return parseBRL(value)
}

function handleCurrencyBlur(field: 'minValue' | 'adminTaxValue' | 'guaranteeFundThreshold') {
  const parsed = parseBRL(currencyDisplayStrings[field] ?? '')
  displayForm[field] = parsed
  currencyDisplayStrings[field] = formatBRL(parsed)
}

function handleMaxValueBlur() {
  const value = currencyDisplayStrings.maxValue ?? ''
  if (!value || value.trim() === '') {
    displayForm.maxValue = null
    currencyDisplayStrings.maxValue = ''
  } else {
    const parsed = parseBRL(value)
    displayForm.maxValue = parsed
    currencyDisplayStrings.maxValue = formatBRL(parsed)
  }
}

function handleCurrencyInput(field: 'minValue' | 'maxValue' | 'adminTaxValue' | 'guaranteeFundThreshold', event: Event) {
  const target = event.target as HTMLInputElement
  currencyDisplayStrings[field] = target.value
  if (field === 'maxValue') {
    displayForm[field] = parseBRLNullable(target.value)
  } else {
    displayForm[field] = parseBRL(target.value)
  }
}

function handleMaxDurationInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value.trim()
  if (value === '' || value === '0') {
    displayForm.maxDurationMonths = null
  } else {
    const parsed = parseInt(value, 10)
    displayForm.maxDurationMonths = isNaN(parsed) ? null : parsed
  }
}

watch(() => props.plan, (plan) => {
  if (plan) {
    displayForm.title = plan.title
    displayForm.description = plan.description
    displayForm.active = plan.active ?? true
    displayForm.minValue = centsToReais(plan.minValueCents)
    displayForm.maxValue = plan.maxValueCents !== null ? centsToReais(plan.maxValueCents) : null
    displayForm.minDurationMonths = plan.minDurationMonths
    displayForm.maxDurationMonths = plan.maxDurationMonths
    displayForm.adminTaxValue = centsToReais(plan.adminTaxValueCents)
    displayForm.insurancePercent = plan.insurancePercent
    displayForm.guaranteeFundPercent1 = plan.guaranteeFundPercent1
    displayForm.guaranteeFundPercent2 = plan.guaranteeFundPercent2
    displayForm.guaranteeFundThreshold = centsToReais(plan.guaranteeFundThresholdCents)

    currencyDisplayStrings.minValue = formatBRL(displayForm.minValue)
    currencyDisplayStrings.maxValue = displayForm.maxValue !== null ? formatBRL(displayForm.maxValue) : ''
    currencyDisplayStrings.adminTaxValue = formatBRL(displayForm.adminTaxValue)
    currencyDisplayStrings.guaranteeFundThreshold = formatBRL(displayForm.guaranteeFundThreshold)
  }
}, { immediate: true })

function validateDisplayForm(state: Partial<DisplayForm>): FormError[] {
  const errors: FormError[] = []

  if (!state.title || !state.title.trim()) {
    errors.push({ name: 'title', message: 'Título é obrigatório' })
  } else if (state.title.trim().length < 3) {
    errors.push({ name: 'title', message: 'Título deve ter pelo menos 3 caracteres' })
  }

  if (!state.description || !state.description.trim()) {
    errors.push({ name: 'description', message: 'Descrição é obrigatória' })
  }

  if (state.minValue === undefined || state.minValue <= 0) {
    errors.push({ name: 'minValue', message: 'O valor mínimo deve ser maior que zero' })
  }
  if (state.maxValue !== null && state.maxValue !== undefined && state.maxValue < 0) {
    errors.push({ name: 'maxValue', message: 'Valor máximo deve ser positivo' })
  }
  if (state.minValue !== undefined && state.maxValue !== null && state.maxValue !== undefined) {
    if (state.minValue >= state.maxValue) {
      errors.push({ name: 'maxValue', message: 'Valor máximo deve ser maior que o mínimo' })
    }
  }

  if (state.minDurationMonths === undefined || state.minDurationMonths < 1) {
    errors.push({ name: 'minDurationMonths', message: 'Duração mínima deve ser pelo menos 1 mês' })
  }
  if (state.maxDurationMonths !== null && state.maxDurationMonths !== undefined && state.maxDurationMonths < 1) {
    errors.push({ name: 'maxDurationMonths', message: 'Duração máxima deve ser pelo menos 1 mês' })
  }
  if (state.minDurationMonths !== undefined && state.maxDurationMonths !== null && state.maxDurationMonths !== undefined) {
    if (state.minDurationMonths >= state.maxDurationMonths) {
      errors.push({ name: 'maxDurationMonths', message: 'Duração máxima deve ser maior que a mínima' })
    }
  }

  if (state.adminTaxValue === undefined || state.adminTaxValue < 0) {
    errors.push({ name: 'adminTaxValue', message: 'Taxa administrativa deve ser positiva' })
  }

  if (state.insurancePercent === undefined || state.insurancePercent < 0 || state.insurancePercent > 100) {
    errors.push({ name: 'insurancePercent', message: 'Percentual de seguro deve estar entre 0 e 100' })
  }
  if (state.guaranteeFundPercent1 === undefined || state.guaranteeFundPercent1 < 0 || state.guaranteeFundPercent1 > 100) {
    errors.push({ name: 'guaranteeFundPercent1', message: 'Percentual fundo garantidor 1 deve estar entre 0 e 100' })
  }
  if (state.guaranteeFundPercent2 === undefined || state.guaranteeFundPercent2 < 0 || state.guaranteeFundPercent2 > 100) {
    errors.push({ name: 'guaranteeFundPercent2', message: 'Percentual fundo garantidor 2 deve estar entre 0 e 100' })
  }
  if (state.guaranteeFundThreshold === undefined || state.guaranteeFundThreshold < 0) {
    errors.push({ name: 'guaranteeFundThreshold', message: 'Limite do fundo garantidor deve ser positivo' })
  }
  if (state.guaranteeFundPercent2 !== undefined && state.guaranteeFundPercent1 !== undefined) {
    if (state.guaranteeFundThreshold !== undefined && state.guaranteeFundThreshold < 0) {
      errors.push({ name: 'guaranteeFundThreshold', message: 'Limite do fundo garantidor deve ser positivo' })
    }
  }

  return errors
}

// ========================
// STEP-SPECIFIC VALIDATION
// ========================

const step1Fields = ['title', 'description']
const step2Fields = ['minValue', 'maxValue', 'minDurationMonths', 'maxDurationMonths']
const step3Fields = ['adminTaxValue', 'insurancePercent', 'guaranteeFundPercent1', 'guaranteeFundPercent2', 'guaranteeFundThreshold']

const formRef = ref<Form<DisplayForm> | null>(null)
async function handleNextStep() {
  const valid = await formRef.value?.validate()
  if (!valid) return
  currentStep.value++
}

function handlePrevStep() {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

const initialDisplayForm: DisplayForm = {
  title: '',
  description: '',
  active: true,
  minValue: 0,
  maxValue: null,
  minDurationMonths: 1,
  maxDurationMonths: null,
  adminTaxValue: 0,
  insurancePercent: 0,
  guaranteeFundPercent1: 0,
  guaranteeFundPercent2: 0,
  guaranteeFundThreshold: 0
}

const initialCurrencyDisplayStrings = {
  minValue: '',
  maxValue: '',
  adminTaxValue: '',
  guaranteeFundThreshold: '0,00'
}

function resetForm() {
  Object.assign(displayForm, initialDisplayForm)
  Object.assign(currencyDisplayStrings, initialCurrencyDisplayStrings)
  currentStep.value = 0
}

function getCurrentStepValidation(state: Partial<DisplayForm>): FormError[] {
  const allErrors = validateDisplayForm(state)
  let fieldsToValidate: string[] = []

  switch (currentStep.value) {
    case 0:
      fieldsToValidate = step1Fields
      break
    case 1:
      fieldsToValidate = step2Fields
      break
    case 2:
      fieldsToValidate = step3Fields
      break
  }

  return allErrors.filter(error => fieldsToValidate.includes(error.name as string))
}

function handleSubmit(event: { data: DisplayForm }) {
  emit('submit', {
    title: event.data.title.trim(),
    description: event.data.description.trim(),
    active: event.data.active,
    minValueCents: reaisToCents(event.data.minValue),
    maxValueCents: event.data.maxValue !== null ? reaisToCents(event.data.maxValue) : null,
    minDurationMonths: event.data.minDurationMonths,
    maxDurationMonths: event.data.maxDurationMonths,
    adminTaxValueCents: reaisToCents(event.data.adminTaxValue),
    insurancePercent: event.data.insurancePercent,
    guaranteeFundPercent1: event.data.guaranteeFundPercent1,
    guaranteeFundPercent2: event.data.guaranteeFundPercent2,
    guaranteeFundThresholdCents: reaisToCents(event.data.guaranteeFundThreshold)
  })
}

function restoreFromPlan() {
  const plan = props.plan
  if (!plan) return

  displayForm.title = plan.title
  displayForm.description = plan.description
  displayForm.active = plan.active ?? true
  displayForm.minValue = centsToReais(plan.minValueCents)
  displayForm.maxValue = plan.maxValueCents !== null ? centsToReais(plan.maxValueCents) : null
  displayForm.minDurationMonths = plan.minDurationMonths
  displayForm.maxDurationMonths = plan.maxDurationMonths
  displayForm.adminTaxValue = centsToReais(plan.adminTaxValueCents)
  displayForm.insurancePercent = plan.insurancePercent
  displayForm.guaranteeFundPercent1 = plan.guaranteeFundPercent1
  displayForm.guaranteeFundPercent2 = plan.guaranteeFundPercent2
  displayForm.guaranteeFundThreshold = centsToReais(plan.guaranteeFundThresholdCents)

  currencyDisplayStrings.minValue = formatBRL(displayForm.minValue)
  currencyDisplayStrings.maxValue = displayForm.maxValue !== null ? formatBRL(displayForm.maxValue) : ''
  currencyDisplayStrings.adminTaxValue = formatBRL(displayForm.adminTaxValue)
  currencyDisplayStrings.guaranteeFundThreshold = formatBRL(displayForm.guaranteeFundThreshold)

  currentStep.value = 0
}

watch(open, (isOpen) => {
  if (!isOpen) {
    if (isEditMode.value) {
      restoreFromPlan()
    } else {
      resetForm()
    }
  }
})

function handleClose() {
  emit('close')
  open.value = false
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :description="modalDescription"
    class="min-w-xl"
  >
    <template #body>
      <!-- Stepper Header -->
      <div class="mb-6">
        <UStepper
          v-model="currentStep"
          :items="stepperItems"
          disabled
          size="sm"
          class="w-full"
        />
        <p class="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
          Etapa {{ currentStep + 1 }} de 3
        </p>
      </div>

      <UForm
        ref="formRef"
        :state="displayForm"
        :validate="getCurrentStepValidation"
        class="space-y-2"
        @submit="handleSubmit"
      >
        <!-- Step 1: Plan Identification -->
        <div
          v-show="currentStep === 0"
          class="space-y-4"
        >
          <div class="flex items-center justify-between border-b pb-2">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">
              Identificação do Plano
            </h3>
          </div>

          <div class="grid grid-cols-[1fr_auto] gap-4 items-end">
            <UFormField
              name="title"
              label="Título"
              required
            >
              <UInput
                v-model="displayForm.title"
                placeholder="Nome do plano"
                icon="i-lucide-tag"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="active"
              label="Ativo"
              class="mr-4 pb-2"
            >
              <USwitch
                v-model="displayForm.active"
                color="primary"
                class="mt-2"
                :ui="{
                  base: 'mt-1'
                }"
              />
            </UFormField>
          </div>

          <UFormField
            name="description"
            label="Descrição (Markdown)"
            required
          >
            <UTextarea
              v-model="displayForm.description"
              placeholder="Descrição detalhada do plano em Markdown"
              :rows="5"
              class="w-full"
            />
          </UFormField>
        </div>

        <!-- Step 2: Value and Duration Constraints -->
        <div
          v-show="currentStep === 1"
          class="space-y-4"
        >
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b pb-2">
            Restrições de Valor e Duração
          </h3>

          <div class="grid grid-cols-2 gap-8">
            <UFormField
              name="minValue"
              label="Valor Mínimo (R$)"
              required
            >
              <UInput
                :model-value="currencyDisplayStrings.minValue"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
                icon="i-lucide-circle-dollar-sign"
                class="w-full"
                @input="handleCurrencyInput('minValue', $event)"
                @blur="handleCurrencyBlur('minValue')"
              />
            </UFormField>

            <UFormField
              name="maxValue"
            >
              <template #label>
                Valor Máximo (R$)
                <UTooltip
                  text="Deixe vazio para não definir um valor máximo."
                  class="align-middle"
                >
                  <Icon
                    name="mdi:information-outline"
                  />
                </UTooltip>
              </template>
              <UInput
                :model-value="currencyDisplayStrings.maxValue"
                type="text"
                inputmode="decimal"
                placeholder="Indefinido"
                icon="i-lucide-circle-dollar-sign"
                class="w-full"
                @input="handleCurrencyInput('maxValue', $event)"
                @blur="handleMaxValueBlur"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-8">
            <UFormField
              name="minDurationMonths"
              label="Duração Mínima (meses)"
              required
            >
              <UInput
                v-model.number="displayForm.minDurationMonths"
                type="number"
                placeholder="6"
                icon="i-lucide-calendar"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="maxDurationMonths"
            >
              <template #label>
                Duração Máxima (meses)
                <UTooltip
                  text="Deixe vazio para não definir uma duração máxima."
                  class="align-middle"
                >
                  <Icon
                    name="mdi:information-outline"
                  />
                </UTooltip>
              </template>
              <UInput
                :model-value="displayForm.maxDurationMonths ?? ''"
                type="number"
                :min="displayForm.minDurationMonths || 0"
                placeholder="Indefinido"
                icon="i-lucide-calendar"
                class="w-full"
                @input="handleMaxDurationInput"
              />
            </UFormField>
          </div>
        </div>

        <!-- Step 3: Financial Parameters -->
        <div
          v-show="currentStep === 2"
          class="space-y-4"
        >
          <!-- First Installment Parameters Section -->
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b pb-2">
            Parâmetros da Primeira Parcela
          </h3>

          <div class="grid grid-cols-2 gap-8">
            <UFormField
              name="adminTaxValue"
              label="Taxa Administrativa (R$)"
              required
            >
              <UInput
                :model-value="currencyDisplayStrings.adminTaxValue"
                type="text"
                inputmode="decimal"
                placeholder="0,00"
                icon="i-lucide-receipt"
                class="w-full"
                @input="handleCurrencyInput('adminTaxValue', $event)"
                @blur="handleCurrencyBlur('adminTaxValue')"
              />
            </UFormField>

            <UFormField
              name="insurancePercent"
              label="Taxa de Seguro (%)"
              required
            >
              <UInput
                v-model.number="displayForm.insurancePercent"
                type="number"
                step="0.01"
                placeholder="2.5"
                icon="i-lucide-shield"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Guarantee Fund Section -->
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 border-b pb-2 mt-6">
            Fundo de proteção
          </h3>

          <div class="grid grid-cols-2 gap-8">
            <UFormField
              name="guaranteeFundPercent1"
              label="Taxa Fundo de proteção Faixa 1 (%)"
              required
            >
              <UInput
                v-model.number="displayForm.guaranteeFundPercent1"
                type="number"
                step="0.01"
                placeholder="1.0"
                icon="i-lucide-percent"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="guaranteeFundPercent2"
              label="Taxa Fundo de proteção Faixa 2 (%)"
              required
            >
              <UInput
                v-model.number="displayForm.guaranteeFundPercent2"
                type="number"
                step="0.01"
                placeholder="1.3"
                icon="i-lucide-percent"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            name="guaranteeFundThreshold"
            label="Limite para Troca de Faixa (R$)"
            required
          >
            <UInput
              :model-value="currencyDisplayStrings.guaranteeFundThreshold"
              type="text"
              inputmode="decimal"
              placeholder="0,00"
              icon="i-lucide-git-branch"
              class="w-full"
              @input="handleCurrencyInput('guaranteeFundThreshold', $event)"
              @blur="handleCurrencyBlur('guaranteeFundThreshold')"
            />
          </UFormField>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between gap-3 pt-4 border-t mt-6">
          <!-- Left side: Cancel button -->
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="handleClose"
          >
            Cancelar
          </UButton>

          <!-- Right side: Back / Next / Submit buttons -->
          <div class="flex gap-3">
            <!-- Back button (disabled on Step 1) -->
            <UButton
              v-if="currentStep > 0"
              type="button"
              color="neutral"
              variant="outline"
              @click="handlePrevStep"
            >
              <UIcon
                name="i-lucide-arrow-left"
                class="w-4 h-4 mr-1"
              />
              Voltar
            </UButton>

            <UButton
              v-if="currentStep < 2"
              type="button"
              color="primary"
              @click="handleNextStep"
            >
              Próximo
              <UIcon
                name="i-lucide-arrow-right"
                class="w-4 h-4 ml-1"
              />
            </UButton>

            <UButton
              v-if="currentStep === 2"
              type="submit"
              color="primary"
              :loading="props.loading"
              :disabled="props.loading"
            >
              <UIcon
                :name="isEditMode ? 'i-lucide-save' : 'i-lucide-plus'"
                class="w-4 h-4 mr-2"
              />
              {{ submitButtonText }}
            </UButton>
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
