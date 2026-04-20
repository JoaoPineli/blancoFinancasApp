<script setup lang="ts">
/**
 * RejectWithdrawalModal — admin modal for rejecting a withdrawal with a reason.
 *
 * Per guardrails:
 * - Render-only: props + emits, no API calls.
 */
const props = defineProps<{
  open: boolean
  transactionId: string | null
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'confirm', transactionId: string, reason: string): void
  (e: 'cancel'): void
}>()

const reason = ref('')

const isValid = computed(() => reason.value.trim().length >= 10)

watch(() => props.open, (val) => {
  if (!val) reason.value = ''
})

function handleConfirm() {
  if (props.transactionId && isValid.value) {
    emit('confirm', props.transactionId, reason.value.trim())
  }
}

function handleCancel() {
  emit('update:open', false)
  emit('cancel')
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
          name="i-lucide-x-circle"
          class="w-5 h-5 text-error-500"
        />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Recusar saque
        </h3>
      </div>
    </template>

    <template #body>
      <div class="space-y-3">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Informe o motivo da recusa. O cliente poderá ver esta mensagem e corrigir os dados para uma nova solicitação.
        </p>
        <UFormField
          label="Motivo da recusa"
          :error="reason.trim().length > 0 && reason.trim().length < 10 ? 'Mínimo de 10 caracteres' : undefined"
          required
        >
          <UTextarea
            v-model="reason"
            placeholder="Ex: A chave Pix informada está inválida. Por favor, verifique e tente novamente."
            :rows="4"
            class="w-full"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="isLoading"
          @click="handleCancel"
        >
          Cancelar
        </UButton>
        <UButton
          color="error"
          :loading="isLoading"
          :disabled="!isValid"
          @click="handleConfirm"
        >
          Recusar saque
        </UButton>
      </div>
    </template>
  </UModal>
</template>
