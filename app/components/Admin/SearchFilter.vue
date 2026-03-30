<script setup lang="ts">
/**
 * Reusable date range filter card with optional extra filters, action buttons, and active chips.
 * - Use without showActions for simple date pickers (e.g. reports).
 * - Use with showActions + default slot for full filter bars (e.g. finance).
 */

defineProps<{
  start: string
  end: string
  isApplying?: boolean
  activeChips?: Array<{ label: string; key: string }>
  showActions?: boolean
}>()

const emit = defineEmits<{
  'update:start': [value: string]
  'update:end': [value: string]
  apply: []
  clear: []
  'remove-chip': [key: string]
}>()
</script>

<template>
  <div class="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 space-y-3">
    <div class="flex flex-wrap gap-2 items-end">
      <!-- Data inicial -->
      <div class="min-w-[140px] flex-1">
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Data inicial
        </label>
        <UInput
          :model-value="start"
          type="date"
          size="sm"
          class="w-full"
          @update:model-value="emit('update:start', String($event))"
        />
      </div>

      <!-- Data final -->
      <div class="min-w-[140px] flex-1">
        <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          Data final
        </label>
        <UInput
          :model-value="end"
          type="date"
          size="sm"
          class="w-full"
          @update:model-value="emit('update:end', String($event))"
        />
      </div>

      <!-- Extra filters (e.g. category, flow type) -->
      <slot />

      <!-- Action buttons -->
      <div
        v-if="showActions"
        class="flex items-end gap-2"
      >
        <UButton
          size="sm"
          :loading="isApplying"
          @click="emit('apply')"
        >
          Aplicar
        </UButton>
        <UButton
          size="sm"
          variant="outline"
          color="error"
          @click="emit('clear')"
        >
          <UIcon
            name="i-lucide-x"
            class="w-4 h-4"
          />
        </UButton>
      </div>
    </div>

    <!-- Active filter chips -->
    <div
      v-if="showActions && activeChips?.length"
      class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-gray-800"
    >
      <span class="text-xs text-gray-400 dark:text-gray-500 mr-1">Filtros ativos:</span>
      <UBadge
        v-for="chip in activeChips"
        :key="chip.key"
        color="primary"
        variant="subtle"
        size="sm"
        class="cursor-pointer gap-1"
        @click="emit('remove-chip', chip.key)"
      >
        {{ chip.label }}
        <UIcon
          name="i-lucide-x"
          class="w-3 h-3"
        />
      </UBadge>
    </div>
  </div>
</template>
