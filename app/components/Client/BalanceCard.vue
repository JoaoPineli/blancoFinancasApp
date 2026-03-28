<script setup lang="ts">
/**
 * BalanceCard component.
 * Per guardrails:
 * - Components must NOT perform financial calculations
 * - All values displayed are provided by the backend
 */

defineProps<{
  title: string
  value: string
  icon: string
  subtitle?: string
  valueSuffix?: string
  trend?: 'up' | 'down' | 'neutral'
}>()
</script>

<template>
  <UCard class="h-full">
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ title }}
        </p>
        <p class="mt-2 text-2xl font-semibold text-gray-900 dark:text-white">
          {{ value }}<span
            v-if="valueSuffix"
            class="text-base font-normal text-gray-400 dark:text-gray-500"
          > / {{ valueSuffix }}</span>
        </p>
        <p
          v-if="subtitle"
          class="mt-1 text-sm text-gray-500 dark:text-gray-400"
        >
          {{ subtitle }}
        </p>
      </div>
      <div
        class="flex h-12 w-12 items-center justify-center rounded-lg"
        :class="{
          'bg-green-100 dark:bg-green-900/30': trend === 'up',
          'bg-red-100 dark:bg-red-900/30': trend === 'down',
          'bg-gray-100 dark:bg-gray-800': trend === 'neutral' || !trend
        }"
      >
        <UIcon
          :name="icon"
          class="h-6 w-6"
          :class="{
            'text-green-600 dark:text-green-400': trend === 'up',
            'text-red-600 dark:text-red-400': trend === 'down',
            'text-gray-600 dark:text-gray-400': trend === 'neutral' || !trend
          }"
        />
      </div>
    </div>
  </UCard>
</template>
