<script setup lang="ts">
/**
 * Client Plans page.
 * View plan details and contract.
 */

definePageMeta({
  middleware: ['auth']
})

const { plans, clientDashboard } = useMockData()
const { formatCurrency, formatPercent } = useCurrency()
const toast = useToast()

const activePlanId = clientDashboard.activePlanId

function handleViewContract() {
  // Mock: In production, this would fetch PDF from backend
  toast.add({
    title: 'Abrindo contrato...',
    description: 'O download do contrato em PDF será iniciado. (Mock)',
    color: 'info'
  })
}

function handleSelectPlan(planId: string) {
  toast.add({
    title: 'Plano selecionado',
    description: 'Entre em contato com o suporte para ativar este plano. (Mock)',
    color: 'info'
  })
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Planos de Investimento
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Conheça nossos planos e escolha o melhor para você.
      </p>
    </div>

    <!-- Plan Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <UCard
        v-for="plan in plans"
        :key="plan.id"
        :class="{ 'ring-2 ring-primary-500': plan.id === activePlanId }"
      >
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ plan.name }}
            </h3>
            <UBadge v-if="plan.id === activePlanId" color="success">
              Seu Plano
            </UBadge>
          </div>
        </template>

        <div class="space-y-4">
          <p class="text-gray-600 dark:text-gray-400">
            {{ plan.description }}
          </p>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Investimento mínimo</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ formatCurrency(plan.minInvestmentCents) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Rendimento mensal</p>
              <p class="text-lg font-semibold text-green-600 dark:text-green-400">
                {{ formatPercent(plan.yieldRateMonthly) }}
              </p>
            </div>
            <div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Prazo</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ plan.termMonths }} meses
              </p>
            </div>
          </div>
        </div>

        <template #footer>
          <div class="flex gap-2">
            <UButton
              v-if="plan.id === activePlanId"
              icon="i-lucide-file-text"
              variant="soft"
              @click="handleViewContract"
            >
              Ver Contrato
            </UButton>
            <UButton
              v-else
              icon="i-lucide-check"
              color="primary"
              @click="handleSelectPlan(plan.id)"
            >
              Selecionar Plano
            </UButton>
          </div>
        </template>
      </UCard>
    </div>

    <!-- Contract Info -->
    <UCard v-if="activePlanId">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-file-text" class="w-5 h-5 text-primary-500" />
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
          @click="handleViewContract"
        >
          Baixar Contrato (PDF)
        </UButton>
      </div>
    </UCard>

    <!-- FAQ -->
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
            label: 'Posso trocar de plano?',
            content: 'Sim, você pode solicitar a troca de plano entrando em contato com o suporte. A alteração será aplicada no próximo ciclo de investimento.'
          },
          {
            label: 'Qual o prazo para saque?',
            content: 'Saques são processados em até 3 dias úteis após a aprovação. Verifique as condições do seu plano para conhecer eventuais restrições.'
          }
        ]"
      />
    </UCard>
  </div>
</template>
