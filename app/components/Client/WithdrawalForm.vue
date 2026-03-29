<script setup lang="ts">
/**
 * WithdrawalForm component.
 * Form to request withdrawal with bank info.
 * Per guardrails: Frontend validation is for UX only.
 */

const emit = defineEmits<{
  (e: 'submit', data: WithdrawalFormData): void
}>()

interface WithdrawalFormData {
  amountCents: number
  bankCode: string
  agency: string
  accountNumber: string
  accountType: 'checking' | 'savings'
}

const form = reactive({
  amount: '',
  bankCode: '',
  agency: '',
  accountNumber: '',
  accountType: 'checking' as 'checking' | 'savings'
})

const isLoading = ref(false)

const bankOptions = [
  { value: '001', label: 'Banco do Brasil' },
  { value: '033', label: 'Santander' },
  { value: '104', label: 'Caixa Econômica' },
  { value: '237', label: 'Bradesco' },
  { value: '341', label: 'Itaú' },
  { value: '260', label: 'Nubank' },
  { value: '077', label: 'Inter' }
]

const accountTypeOptions = [
  { value: 'checking', label: 'Conta Corrente' },
  { value: 'savings', label: 'Poupança' }
]

function handleSubmit() {
  // Convert display amount to cents (simple parse for mock)
  // Per guardrails: This is presentation/UX only
  const amountValue = parseFloat(form.amount.replace(/[^\d,]/g, '').replace(',', '.'))
  const amountCents = Math.round(amountValue * 100)

  if (isNaN(amountCents) || amountCents <= 0) {
    return
  }

  isLoading.value = true

  // Emit to parent for handling
  emit('submit', {
    amountCents,
    bankCode: form.bankCode,
    agency: form.agency,
    accountNumber: form.accountNumber,
    accountType: form.accountType
  })

  isLoading.value = false
}

function formatAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.value.replace(/\D/g, '')

  if (value) {
    const numValue = parseInt(value) / 100
    form.amount = numValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  } else {
    form.amount = ''
  }
}
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-banknote"
          class="w-5 h-5 text-primary-500"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Solicitar Saque
        </h3>
      </div>
    </template>

    <form
      class="space-y-4"
      @submit.prevent="handleSubmit"
    >
      <UFormField
        label="Valor do saque"
        required
      >
        <UInput
          v-model="form.amount"
          placeholder="0,00"
          icon="i-lucide-dollar-sign"
          @input="formatAmountInput"
        />
      </UFormField>

      <UFormField
        label="Banco"
        required
      >
        <USelect
          v-model="form.bankCode"
          :items="bankOptions"
          placeholder="Selecione o banco"
        />
      </UFormField>

      <div class="grid grid-cols-2 gap-4">
        <UFormField
          label="Agência"
          required
        >
          <UInput
            v-model="form.agency"
            placeholder="0000"
            maxlength="4"
          />
        </UFormField>

        <UFormField
          label="Conta"
          required
        >
          <UInput
            v-model="form.accountNumber"
            placeholder="00000-0"
          />
        </UFormField>
      </div>

      <UFormField
        label="Tipo de conta"
        required
      >
        <USelect
          v-model="form.accountType"
          :items="accountTypeOptions"
        />
      </UFormField>

      <UButton
        type="submit"
        color="primary"
        block
        :loading="isLoading"
        :disabled="!form.amount || !form.bankCode || !form.agency || !form.accountNumber"
      >
        Solicitar Saque
      </UButton>

      <UAlert
        icon="i-lucide-clock"
        color="warning"
        variant="subtle"
        title="Prazo de processamento"
        description="Saques são processados em até 3 dias úteis após aprovação."
      />
    </form>
  </UCard>
</template>
