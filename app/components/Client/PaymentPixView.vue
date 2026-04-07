<script setup lang="ts">
/**
 * PaymentPixView — shows Pix QR code after installment payment creation.
 *
 * Displays:
 * - Payment summary (items + total)
 * - Pix QR code / copy-paste
 * - Expiration countdown
 * - Back button to return to installment selection
 *
 * Per guardrails:
 * - QR code string comes from backend
 * - No financial calculations
 */
import type { InstallmentPayment } from '~/composables/useFinanceApi'

const props = defineProps<{
  payment: InstallmentPayment
}>()

const emit = defineEmits<{
  (e: 'back'): void
}>()

const { formatCurrency } = useCurrency()
const toast = useToast()

async function copyToClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      title: 'Código copiado!',
      description: 'O código Pix foi copiado para a área de transferência.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Erro ao copiar',
      description: 'Não foi possível copiar o código.',
      color: 'error'
    })
  }
}

const statusConfig = computed(() => {
  switch (props.payment.status) {
    case 'confirmed':
      return { label: 'Confirmado', color: 'success' as const, icon: 'i-lucide-check-circle' }
    case 'expired':
      return { label: 'Expirado', color: 'error' as const, icon: 'i-lucide-clock' }
    case 'cancelled':
      return { label: 'Cancelado', color: 'error' as const, icon: 'i-lucide-x-circle' }
    case 'failed':
      return { label: 'Falhou', color: 'error' as const, icon: 'i-lucide-alert-triangle' }
    default:
      return { label: 'Aguardando pagamento', color: 'warning' as const, icon: 'i-lucide-clock' }
  }
})

const isPending = computed(() => props.payment.status === 'pending')
const parseUtc = (value: string) =>
  new Date(value.replace(' ', 'T').replace(/(\.\d{3})\d+$/, '$1') + 'Z')

const pixExpirationDate = computed(() => {
  const { createdAt, expirationMinutes } = props.payment
  if (!createdAt || expirationMinutes == null) return null
  const date = parseUtc(createdAt)
  if (Number.isNaN(date.getTime())) return null
  return new Date(date.getTime() + expirationMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<template>
  <div class="space-y-4">
    <!-- Back button -->
    <button
      type="button"
      class="flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
      @click="emit('back')"
    >
      <UIcon
        name="i-lucide-arrow-left"
        class="w-4 h-4"
      />
      Voltar para parcelas
    </button>

    <!-- Status header -->
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            Pagamento de parcelas
          </h3>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ payment.items.length }}
            {{ payment.items.length === 1 ? 'parcela selecionada' : 'parcelas selecionadas' }}
          </p>
        </div>
        <UBadge
          :color="statusConfig.color"
          variant="subtle"
        >
          <UIcon
            :name="statusConfig.icon"
            class="w-3.5 h-3.5 mr-1"
          />
          {{ statusConfig.label }}
        </UBadge>
      </div>
    </UCard>

    <!-- Items summary -->
    <UCard>
      <template #header>
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Parcelas incluídas
        </h4>
      </template>

      <div class="space-y-3">
        <div
          v-for="item in payment.items"
          :key="item.id"
          class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
        >
          <div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ item.subscriptionName }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Parcela {{ item.installmentNumber }} · {{ item.planTitle }}
            </p>
          </div>
          <p class="text-sm font-semibold text-gray-900 dark:text-white">
            {{ formatCurrency(item.amountCents) }}
          </p>
        </div>
      </div>

      <!-- Total -->
      <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <p class="text-base font-bold text-gray-900 dark:text-white">
          Total
        </p>
        <p class="text-lg font-bold text-primary-600 dark:text-primary-400">
          {{ formatCurrency(payment.totalAmountCents) }}
        </p>
      </div>
    </UCard>

    <!-- Pix section (only for pending) -->
    <UCard v-if="isPending && payment.pixQrCodeData">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-qr-code"
            class="w-5 h-5 text-primary-500"
          />
          <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Pague via Pix
          </h4>
        </div>
      </template>

      <div class="flex flex-col items-center gap-3 py-2">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
          Escaneie o QR Code para pagar
        </p>

        <div class="bg-white rounded-lg p-3 border">
          <img
            v-if="payment.pixQrCodeBase64"
            :src="'data:image/png;base64,' + payment.pixQrCodeBase64"
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
          {{ pixExpirationDate ? 'Válido até ' + pixExpirationDate : 'Erro ao carregar data de expiração' }}
        </p>

        <UButton
          variant="outline"
          size="sm"
          icon="i-lucide-copy"
          @click="copyToClipboard(payment.pixQrCodeData!)"
        >
          Copiar código Pix
        </UButton>
        <UAlert
          icon="i-lucide-info"
          color="info"
          variant="subtle"
          title="Como pagar"
          description="Abra o app do seu banco, escolha Pix e escaneie o QR code ou cole o código. O pagamento será confirmado automaticamente."
        />
      </div>
    </UCard>

    <!-- Confirmed state -->
    <UAlert
      v-if="payment.status === 'confirmed'"
      icon="i-lucide-check-circle"
      color="success"
      variant="subtle"
      title="Pagamento confirmado!"
      description="Suas parcelas foram registradas com sucesso."
    />
  </div>
</template>
