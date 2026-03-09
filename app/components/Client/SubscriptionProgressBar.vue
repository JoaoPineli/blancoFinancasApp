<script setup lang="ts">
/**
 * SubscriptionProgressBar component.
 * Displays a visual progress bar with percentage text for a subscription.
 *
 * Per guardrails:
 * - No financial calculations — only displays backend-provided values.
 * - Handles edge cases: null/undefined accumulated, target = 0, > 100%.
 *
 * Props:
 *   accumulatedCents — Amount deposited so far (null/undefined = unavailable)
 *   targetCents      — Goal amount
 *   compact          — Smaller variant for compact row mode
 */
const props = withDefaults(defineProps<{
  accumulatedCents?: number | null
  targetCents: number
  compact?: boolean
}>(), {
  accumulatedCents: null,
  compact: false
})

const { formatCurrency } = useCurrency()

/** Whether the accumulated value is available from the backend */
const isAvailable = computed(() =>
  props.accumulatedCents != null && props.accumulatedCents !== undefined
)

/**
 * Ratio as percentage (can exceed 100).
 * Returns 0 when data is unavailable or target is 0.
 */
const percentage = computed(() => {
  if (!isAvailable.value || props.targetCents <= 0) return 0
  return (props.accumulatedCents! / props.targetCents) * 100
})

/** Visual width capped at 100% */
const visualPercentage = computed(() => Math.min(percentage.value, 100))

/** Remaining cents until goal. null when data unavailable */
const remainingCents = computed(() => {
  if (!isAvailable.value) return null
  return Math.max(props.targetCents - props.accumulatedCents!, 0)
})

/** Whether the deposit exceeds the goal */
const isExceeded = computed(() => isAvailable.value && percentage.value > 100)

const excessCents = computed(() => {
  if (!isExceeded.value) return 0
  return props.accumulatedCents! - props.targetCents
})
</script>

<template>
  <div :class="compact ? 'w-24' : 'w-full'">
    <!-- Progress bar (shown whether data is available or not) -->
    <div
      class="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden"
      :class="compact ? 'h-1.5' : 'h-2.5'"
      role="progressbar"
      :aria-valuenow="isAvailable ? Math.round(percentage) : undefined"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-label="isAvailable ? `Progresso: ${Math.round(percentage)}%` : 'Progresso indisponível'"
    >
      <div
        v-if="isAvailable"
        class="h-full rounded-full transition-all duration-300"
        :class="isExceeded ? 'bg-green-500' : 'bg-primary-500'"
        :style="{ width: `${visualPercentage}%` }"
      />
    </div>

    <!-- Text below bar -->
    <template v-if="!compact">
      <!-- Available: show percentage + remaining -->
      <div
        v-if="isAvailable"
        class="flex justify-between mt-1 text-xs text-gray-600 dark:text-gray-400"
      >
        <span class="font-medium">{{ Math.round(percentage) }}% concluído</span>
        <span
          v-if="isExceeded"
          class="text-green-600 dark:text-green-400"
        >
          Excedente: {{ formatCurrency(excessCents) }}
        </span>
        <span v-else-if="remainingCents !== null && remainingCents > 0">
          Falta {{ formatCurrency(remainingCents) }}
        </span>
      </div>

      <!-- Unavailable: dash + info tooltip -->
      <div
        v-else
        class="flex items-center gap-1.5 mt-1"
      >
        <span class="text-xs text-gray-400 dark:text-gray-500">
          Progresso indisponível
        </span>
        <UTooltip text="O valor acumulado ainda não está disponível para esta poupança.">
          <UIcon
            name="i-lucide-info"
            class="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 cursor-help"
            aria-label="Valor acumulado indisponível no momento"
          />
        </UTooltip>
      </div>
    </template>

    <!-- Compact: mini text -->
    <template v-else>
      <span
        v-if="isAvailable"
        class="text-[10px] text-gray-500 dark:text-gray-400"
      >
        {{ Math.round(percentage) }}%
      </span>
      <span
        v-else
        class="text-[10px] text-gray-400 dark:text-gray-500"
      >
        —
      </span>
    </template>
  </div>
</template>
