<script setup lang="ts">
/**
 * Client Plans page.
 * Displays user's plan subscriptions and allows creating new ones.
 * Modal logic is delegated to ClientNewSubscriptionModal component.
 */
definePageMeta({
  middleware: ['auth']
})

const { formatCurrency } = useCurrency()
const toast = useToast()
const {
  subscriptions,
  isLoading,
  error,
  fetchSubscriptions
} = useSubscriptionsApi()

const showModal = ref(false)

function openModal() {
  showModal.value = true
}

function handleSubscriptionCreated(data: { planTitle: string }) {
  toast.add({
    title: 'Assinatura criada!',
    description: `Assinatura do plano "${data.planTitle}" criada com sucesso.`,
    color: 'success'
  })
  fetchSubscriptions()
}

onMounted(() => {
  fetchSubscriptions()
})

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Ativa',
    completed: 'Concluída',
    cancelled: 'Cancelada'
  }
  return labels[status] || status
}

function statusColor(status: string): 'success' | 'neutral' | 'error' {
  const colors: Record<string, 'success' | 'neutral' | 'error'> = {
    active: 'success',
    completed: 'neutral',
    cancelled: 'error'
  }
  return colors[status] || 'neutral'
}
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-2 md:grid-cols-2 gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Minhas Poupanças
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Gerencie suas assinaturas de planos de poupança.
        </p>
      </div>
      <div class="flex items-center justify-end gap-2">
        <UButton
          icon="i-lucide-plus"
          @click="openModal"
        >
          Nova Poupança
        </UButton>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="w-8 h-8 animate-spin text-primary-500"
      />
      <span class="ml-2 text-gray-500">Carregando assinaturas...</span>
    </div>

    <UCard
      v-else-if="error"
      class="border-red-200 dark:border-red-800"
    >
      <div class="flex items-center gap-3 text-red-600 dark:text-red-400">
        <UIcon
          name="i-lucide-alert-circle"
          class="w-5 h-5"
        />
        <span>{{ error }}</span>
        <UButton
          variant="soft"
          size="sm"
          @click="fetchSubscriptions"
        >
          Tentar novamente
        </UButton>
      </div>
    </UCard>

    <UCard v-else-if="subscriptions.length === 0">
      <div class="text-center py-8">
        <UIcon
          name="i-lucide-inbox"
          class="w-12 h-12 mx-auto text-gray-400 mb-4"
        />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nenhuma poupança encontrada
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Você ainda não possui nenhuma assinatura de plano. Clique abaixo para começar.
        </p>
        <UButton
          icon="i-lucide-plus"
          @click="openModal"
        >
          Criar Primeira Poupança
        </UButton>
      </div>
    </UCard>

    <div
      v-else
      class="grid grid-cols-1 gap-6"
    >
      <UCard
        v-for="sub in subscriptions"
        :key="sub.id"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ sub.planTitle }}
            </h3>
            <UBadge :color="statusColor(sub.status)">
              {{ statusLabel(sub.status) }}
            </UBadge>
          </div>
        </template>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Objetivo
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(sub.targetAmountCents) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Parcela mensal
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ formatCurrency(sub.monthlyAmountCents) }}
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Nº de parcelas
            </p>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ sub.depositCount }}x
            </p>
          </div>
          <div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Custo total (taxas)
            </p>
            <p class="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {{ formatCurrency(sub.totalCostCents) }}
            </p>
          </div>
        </div>

        <template #footer>
          <p class="text-xs text-gray-400 dark:text-gray-500">
            Criada em {{ new Date(sub.createdAt).toLocaleDateString('pt-BR') }}
          </p>
        </template>
      </UCard>
    </div>

    <UCard v-if="true">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-file-text"
            class="w-5 h-5 text-primary-500"
          />
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Seu Contrato
          </h2>
        </div>
      </template>

      <div class="space-y-4">
        <p class="text-gray-600 dark:text-gray-400">
          Você possui um contrato ativo com a Blanco Finanças. Clique no botão abaixo para visualizar
          ou baixar uma cópia do seu contrato.
        </p>

        <UButton
          icon="i-lucide-download"
          variant="soft"
          @click="toast.add({ title: 'Download', description: 'Função de download de contrato ainda não implementada.', color: 'info' })"
        >
          Baixar Contrato (PDF)
        </UButton>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Perguntas Frequentes
        </h2>
      </template>

      <UAccordion
        :items="[
          {
            label: 'Como funciona o rendimento?',
            content: 'O rendimento é calculado mensalmente sobre o valor investido e creditado automaticamente na sua conta. Todos os valores são fornecidos pelo sistema.'
          },
          {
            label: 'Posso ter mais de uma poupança?',
            content: 'Sim! Você pode criar quantas assinaturas quiser, inclusive múltiplas do mesmo plano com parâmetros diferentes.'
          },
          {
            label: 'Qual o prazo para saque?',
            content: 'Saques são processados em até 3 dias úteis após a aprovação. Verifique as condições do seu plano para conhecer eventuais restrições.'
          }
        ]"
      />
    </UCard>

    <ClientNewSubscriptionModal
      v-model:open="showModal"
      @created="handleSubscriptionCreated"
      @close="showModal = false"
    />
  </div>
</template>
