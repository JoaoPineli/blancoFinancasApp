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
const isExporting = ref(false)

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

async function handleExport(reportId: string, format: string) {
  isExporting.value = true

  // Mock: Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000))

  toast.add({
    title: 'Exportação iniciada',
    description: `O relatório será baixado em formato ${format}. (Mock)`,
    color: 'success'
  })

  isExporting.value = false
}

// Date range for reports
const dateRange = reactive({
  start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
  end: new Date().toISOString().split('T')[0]
})
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
        <UFormField label="Data Inicial" class="flex-1">
          <UInput
            v-model="dateRange.start"
            type="date"
          />
        </UFormField>
        <UFormField label="Data Final" class="flex-1">
          <UInput
            v-model="dateRange.end"
            type="date"
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Report Types -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UCard v-for="report in reportTypes" :key="report.id">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/30">
            <UIcon :name="report.icon" class="w-6 h-6 text-primary-600 dark:text-primary-400" />
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
            :loading="isExporting"
            @click="handleExport(report.id, format)"
          >
            <UIcon name="i-lucide-download" class="w-4 h-4 mr-1" />
            {{ format }}
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Export History -->
    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Últimas Exportações
        </h2>
      </template>

      <div class="space-y-3">
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-file-spreadsheet" class="w-5 h-5 text-green-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Relatório de Clientes.xlsx</p>
              <p class="text-xs text-gray-500">14/01/2026 às 10:30</p>
            </div>
          </div>
          <UBadge color="success" variant="subtle">Concluído</UBadge>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-file-spreadsheet" class="w-5 h-5 text-green-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Fluxo de Caixa - Janeiro.xlsx</p>
              <p class="text-xs text-gray-500">13/01/2026 às 15:45</p>
            </div>
          </div>
          <UBadge color="success" variant="subtle">Concluído</UBadge>
        </div>

        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div class="flex items-center gap-3">
            <UIcon name="i-lucide-file-text" class="w-5 h-5 text-blue-500" />
            <div>
              <p class="font-medium text-gray-900 dark:text-white">Relatório de Rendimentos.pdf</p>
              <p class="text-xs text-gray-500">10/01/2026 às 09:15</p>
            </div>
          </div>
          <UBadge color="success" variant="subtle">Concluído</UBadge>
        </div>
      </div>
    </UCard>
  </div>
</template>
