<script setup lang="ts">
/**
 * Client Finance page.
 * Deposit (Pix) and withdrawal requests.
 */

definePageMeta({
  middleware: ['auth']
})

const { mockPixQrCode, installments, withdrawals } = useMockData()
const toast = useToast()

const activeTab = ref('deposit')

interface WithdrawalFormData {
  amountCents: number
  bankCode: string
  agency: string
  accountNumber: string
  accountType: 'checking' | 'savings'
}

function handleWithdrawalSubmit(data: WithdrawalFormData) {
  // Mock: In production, this would call the API
  toast.add({
    title: 'Solicitação enviada!',
    description: 'Seu pedido de saque foi registrado e está em análise.',
    color: 'success'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Financeiro
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Gerencie seus depósitos e saques.
      </p>
    </div>

    <!-- Tabs -->
    <UTabs
      v-model="activeTab"
      :items="[
        { label: 'Depósito', value: 'deposit', icon: 'i-lucide-arrow-down-left' },
        { label: 'Saque', value: 'withdrawal', icon: 'i-lucide-arrow-up-right' },
        { label: 'Histórico', value: 'history', icon: 'i-lucide-history' }
      ]"
    />

    <!-- Deposit Tab -->
    <div v-if="activeTab === 'deposit'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ClientPixQrCode :pix-code="mockPixQrCode" />

      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
            Instruções para Depósito
          </h3>
        </template>

        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm">
              1
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Copie o código Pix</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Clique no botão de copiar ao lado do código ou escaneie o QR code.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm">
              2
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Faça o pagamento</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Use o app do seu banco para realizar o pagamento via Pix.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-semibold text-sm">
              3
            </div>
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Aguarde confirmação</p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                O valor será creditado automaticamente após confirmação do pagamento.
              </p>
            </div>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Withdrawal Tab -->
    <div v-if="activeTab === 'withdrawal'" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ClientWithdrawalForm @submit="handleWithdrawalSubmit" />
      <ClientWithdrawalList :withdrawals="withdrawals" />
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'">
      <ClientInstallmentTimeline :installments="installments" />
    </div>
  </div>
</template>
