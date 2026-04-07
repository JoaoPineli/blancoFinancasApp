<script setup lang="ts">
/**
 * PixQrCode component.
 * Displays Pix QR code for deposits.
 * Per guardrails: QR code string is provided by the backend.
 */

defineProps<{
  pixCode: string
  pixQrCodeBase64?: string
}>()

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
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-qr-code" class="w-5 h-5 text-primary-500" />
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          Depósito via Pix
        </h3>
      </div>
    </template>

    <div class="flex flex-col items-center gap-4">
      <!-- QR Code image from Mercado Pago -->
      <img
        v-if="pixQrCodeBase64"
        :src="'data:image/png;base64,' + pixQrCodeBase64"
        alt="QR Code Pix"
        class="w-48 h-48 rounded-lg"
      />
      <div
        v-else
        class="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center"
      >
        <div class="text-center p-4">
          <UIcon name="i-lucide-qr-code" class="w-24 h-24 text-gray-400" />
          <p class="text-xs text-gray-500 mt-2">QR Code Pix</p>
        </div>
      </div>

      <div class="w-full">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Código Pix (copia e cola):
        </p>
        <div class="flex gap-2">
          <UInput
            :model-value="pixCode"
            readonly
            class="flex-1 font-mono text-xs"
          />
          <UButton
            icon="i-lucide-copy"
            color="primary"
            variant="soft"
            @click="copyToClipboard(pixCode)"
          />
        </div>
      </div>

      <UAlert
        icon="i-lucide-info"
        color="info"
        variant="subtle"
        title="Instruções"
        description="Escaneie o QR code ou copie o código Pix para realizar o depósito. O valor será creditado após confirmação."
      />
    </div>
  </UCard>
</template>
