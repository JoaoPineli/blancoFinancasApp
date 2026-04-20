<script setup lang="ts">
/**
 * WithdrawalConfirmationModal — confirms plan withdrawal before executing.
 *
 * Collects Pix data (owner name, key type, key) required for the withdrawal.
 * Shows the subscription details and an ownership warning.
 *
 * Per guardrails:
 * - No financial calculations. All data from the backend.
 * - Modal pattern matches existing ConfirmationModal.
 */
import type { WithdrawableSubscription } from '~/composables/useFinanceApi'

const props = defineProps<{
  open: boolean
  subscription: WithdrawableSubscription | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm', subscriptionId: string, pixData: { ownerName: string, pixKeyType: string, pixKey: string }): void
}>()

const { formatCurrency } = useCurrency()

const ownerName = ref('')
const pixKeyType = ref('')
const pixKey = ref('')

const pixKeyTypes = [
  { label: 'CPF', value: 'cpf' },
  { label: 'E-mail', value: 'email' },
  { label: 'Celular', value: 'celular' },
  { label: 'Chave aleatória', value: 'aleatoria' }
]

const pixKeyPlaceholder = computed(() => {
  switch (pixKeyType.value) {
    case 'cpf': return '000.000.000-00'
    case 'email': return 'seu@email.com'
    case 'celular': return '+55 11 99999-9999'
    case 'aleatoria': return 'Chave aleatória (UUID)'
    default: return 'Selecione o tipo primeiro'
  }
})

const isFormValid = computed(() =>
  ownerName.value.trim().length >= 3
  && pixKeyType.value !== ''
  && pixKey.value.trim().length >= 5
)

watch(() => props.open, (val) => {
  if (!val) {
    ownerName.value = ''
    pixKeyType.value = ''
    pixKey.value = ''
  }
})

function handleConfirm() {
  if (props.subscription && isFormValid.value) {
    emit('confirm', props.subscription.subscriptionId, {
      ownerName: ownerName.value.trim(),
      pixKeyType: pixKeyType.value,
      pixKey: pixKey.value.trim()
    })
  }
}
</script>

<template>
  <UModal
    :open="open"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon
          name="i-lucide-arrow-up-right"
          class="w-5 h-5 text-warning-500"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Solicitar retirada
        </h3>
      </div>
    </template>

    <template #body>
      <div
        v-if="subscription"
        class="space-y-4"
      >
        <!-- Plan summary -->
        <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 space-y-2">
          <div class="flex justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Poupança</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ subscription.subscriptionName }}
            </span>
          </div>
          <div class="flex justify-between">
            <span class="text-sm text-gray-500 dark:text-gray-400">Parcelas pagas</span>
            <span class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ subscription.depositsPaid }} de {{ subscription.depositCount }}
            </span>
          </div>
          <div class="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Valor a receber</span>
            <span class="text-base font-bold text-primary-600 dark:text-primary-400">
              {{ formatCurrency(subscription.withdrawableAmountCents) }}
            </span>
          </div>
        </div>

        <!-- Early termination warning -->
        <UAlert
          v-if="subscription.isEarlyTermination"
          icon="i-lucide-alert-triangle"
          color="warning"
          variant="subtle"
          title="Atenção: encerramento antecipado"
          description="Ao confirmar, este plano será encerrado. Essa ação não pode ser desfeita."
        />

        <!-- Ownership notice -->
        <UAlert
          icon="i-lucide-shield-check"
          color="info"
          variant="subtle"
          title="Importante"
          description="Saques só serão realizados para contas cuja titularidade seja a mesma do titular da conta na Blanco Finanças."
        />

        <!-- Pix form -->
        <div class="space-y-3">
          <UFormField
            label="Nome completo do titular"
            required
          >
            <UInput
              v-model="ownerName"
              placeholder="Nome como consta na conta bancária"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Tipo de chave Pix"
            required
          >
            <USelect
              v-model="pixKeyType"
              :items="pixKeyTypes"
              placeholder="Selecione o tipo"
              class="w-full"
            />
          </UFormField>

          <UFormField
            label="Chave Pix"
            required
          >
            <UInput
              v-model="pixKey"
              :placeholder="pixKeyPlaceholder"
              :disabled="!pixKeyType"
              class="w-full"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="emit('update:open', false)"
        >
          Cancelar
        </UButton>
        <UButton
          color="primary"
          :loading="isLoading"
          :disabled="!isFormValid"
          @click="handleConfirm"
        >
          Solicitar retirada
        </UButton>
      </div>
    </template>
  </UModal>
</template>
