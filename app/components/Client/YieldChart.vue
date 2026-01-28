<script setup lang="ts">
/**
 * YieldChart component (placeholder).
 * Per guardrails:
 * - Do not add external charting libraries unless necessary
 * - Display data as provided by the backend
 */

interface YieldDataPoint {
  month: string
  valueCents: number
}

const props = defineProps<{
  data: YieldDataPoint[]
}>()

const { formatCurrency } = useCurrency()

// Find max value for scaling bars
const maxValue = computed(() => {
  if (props.data.length === 0) return 0
  return Math.max(...props.data.map(d => d.valueCents))
})

function getBarHeight(valueCents: number): number {
  if (maxValue.value === 0) return 0
  return (valueCents / maxValue.value) * 100
}
</script>

<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
        Histórico de Rendimentos
      </h3>
    </template>

    <div class="h-48 flex items-end gap-2">
      <div
        v-for="point in data"
        :key="point.month"
        class="flex-1 flex flex-col items-center gap-2"
      >
        <div class="w-full flex flex-col items-center">
          <span class="text-xs text-gray-500 dark:text-gray-400 mb-1">
            {{ formatCurrency(point.valueCents) }}
          </span>
          <div
            class="w-full bg-primary-500 rounded-t transition-all duration-300"
            :style="{ height: `${getBarHeight(point.valueCents)}px`, maxHeight: '140px' }"
          />
        </div>
        <span class="text-xs text-gray-600 dark:text-gray-400">
          {{ point.month }}
        </span>
      </div>
    </div>

    <p v-if="data.length === 0" class="text-center text-gray-500 dark:text-gray-400 py-8">
      Nenhum dado de rendimento disponível.
    </p>
  </UCard>
</template>
