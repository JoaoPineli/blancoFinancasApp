<script setup lang="ts">
/**
 * Admin Reports page.
 * Export data functionality.
 * Per guardrails: Destructive actions require confirmation.
 */

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()
const { isLoading, downloadReport } = useAdminReportsApi()

const reportTypes = [
  {
    id: 'clients',
    title: 'Relatório de Clientes',
    description: 'Lista completa de clientes com status e informações de contato.',
    icon: 'i-lucide-users',
    formats: ['Excel', 'CSV']
  },
  {
    id: 'transactions',
    title: 'Relatório de Transações',
    description: 'Histórico de todas as transações (depósitos e saques).',
    icon: 'i-lucide-receipt',
    formats: ['Excel', 'CSV']
  },
  {
    id: 'cashflow',
    title: 'Relatório de Fluxo de Caixa',
    description: 'Entradas e saídas financeiras do período selecionado.',
    icon: 'i-lucide-bar-chart-3',
    formats: ['Excel', 'CSV', 'PDF']
  },
  {
    id: 'yields',
    title: 'Relatório de Rendimentos',
    description: 'Rendimentos distribuídos por cliente e período.',
    icon: 'i-lucide-trending-up',
    formats: ['Excel', 'CSV']
  }
]

// Date range for reports
const dateRange = reactive({
  start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})

async function handleExport(reportId: string, format: string) {
  if (!dateRange.start || !dateRange.end) {
    toast.add({
      title: 'Período inválido',
      description: 'Preencha a data inicial e a data final antes de exportar.',
      color: 'error'
    })
    return
  }

  if (dateRange.start > dateRange.end) {
    toast.add({
      title: 'Período inválido',
      description: 'A data inicial não pode ser posterior à data final.',
      color: 'error'
    })
    return
  }

  await downloadReport(reportId, format, dateRange.start, dateRange.end)
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Relatórios
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Exporte dados e relatórios do sistema.
      </p>
    </div>

    <!-- Date Filter -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Período do Relatório
        </h2>
      </template>

      <div class="flex flex-col sm:flex-row gap-4">
        <UFormField
          label="Data Inicial"
          class="flex-1"
        >
          <UInput
            v-model="dateRange.start"
            type="date"
          />
        </UFormField>
        <UFormField
          label="Data Final"
          class="flex-1"
        >
          <UInput
            v-model="dateRange.end"
            type="date"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Report Types -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard
        v-for="report in reportTypes"
        :key="report.id"
      >
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <UIcon
              :name="report.icon"
              class="w-6 h-6 text-primary-600 dark:text-primary-400"
            />
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white">
              {{ report.title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ report.description }}
            </p>
          </div>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <UButton
            v-for="format in report.formats"
            :key="format"
            size="sm"
            variant="soft"
            :loading="isLoading(report.id, format)"
            @click="handleExport(report.id, format)"
          >
            <UIcon
              name="i-lucide-download"
              class="w-4 h-4 mr-1"
            />
            {{ format }}
          </UButton>
        </div>
      </UCard>
    </div>
  </div>
</template>
