<script setup lang="ts">
/**
 * PlanCard component for Admin.
 * Displays a clickable card representing a plan.
 * Per guardrails:
 * - Components emit user intent (events), do not perform business logic
 * - No financial calculations performed here
 */

import type { AdminPlan } from '~/types/admin-plan'

const props = defineProps<{
  plan: AdminPlan
}>()

const emit = defineEmits<{
  (e: 'click', plan: AdminPlan): void
  (e: 'delete', plan: AdminPlan): void
  (e: 'activate', plan: AdminPlan): void
  (e: 'inactivate', plan: AdminPlan): void
}>()

const { formatCurrency } = useCurrency()

// Format value range for display
const valueRange = computed(() => {
  const min = formatCurrency(props.plan.minValueCents)
  const max = props.plan.maxValueCents !== null
    ? formatCurrency(props.plan.maxValueCents)
    : 'Indefinido'
  return `${min} – ${max}`
})

// Format duration range for display
const durationRange = computed(() => {
  const min = props.plan.minDurationMonths
  const max = props.plan.maxDurationMonths
  if (max === null) {
    return `A partir de ${min} ${min === 1 ? 'mês' : 'meses'}`
  }
  if (min === max) {
    return `${min} ${min === 1 ? 'mês' : 'meses'}`
  }
  return `${min} – ${max} meses`
})

function handleClick() {
  emit('click', props.plan)
}

function handleDelete() {
  emit('delete', props.plan)
}

function handleActivate() {
  emit('activate', props.plan)
}

function handleInactivate() {
  emit('inactivate', props.plan)
}

const dropdownItems = computed(() => {
  const items: Array<{ label: string, icon?: string, color?: 'primary' | 'neutral' | 'success' | 'warning' | 'error', onSelect: () => void }> = []

  if (props.plan.active) {
    items.push({
      label: 'Inativar Plano',
      icon: 'i-lucide-ban',
      color: 'warning',
      onSelect: () => handleInactivate()
    })
  } else {
    items.push({
      label: 'Ativar Plano',
      icon: 'i-lucide-check-circle',
      color: 'success',
      onSelect: () => handleActivate()
    })
  }

  items.push({
    label: 'Deletar Plano',
    icon: 'i-lucide-trash',
    color: 'error',
    onSelect: () => handleDelete()
  })

  return items
})

onMounted(() => {
  console.log('PlanCard mounted for plan:', props.plan)
})
</script>

<template>
  <UCard
    class="cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary-500 dark:hover:border-primary-400"
    @click="handleClick"
  >
    <div class="space-y-3">
      <!-- Title -->
      <div class="flex items-start justify-between">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
          {{ plan.title }}
        </h3>
        <div
          class="flex items-center"
        >
          <UBadge
            :color="plan.active ? 'success' : 'neutral'"
            variant="subtle"
            size="sm"
          >
            {{ plan.active ? 'Ativo' : 'Inativo' }}
          </UBadge>
          <UDropdownMenu
            class="ml-2"
            :items="dropdownItems"
          >
            <UButton
              icon="material-symbols:menu-rounded"
              color="neutral"
              variant="ghost"
              size="xs"
              @click.stop
            />
          </UDropdownMenu>
        </div>
      </div>

      <!-- Value Range -->
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <UIcon
          name="i-lucide-circle-dollar-sign"
          class="w-4 h-4"
        />
        <span class="font-medium">Valor Contratado:</span>
        <span>{{ valueRange }}</span>
      </div>

      <!-- Duration Range -->
      <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <UIcon
          name="i-lucide-calendar"
          class="w-4 h-4"
        />
        <span class="font-medium">Duração:</span>
        <span>{{ durationRange }}</span>
      </div>

      <!-- Click indicator -->
      <div class="flex items-center justify-end text-xs text-gray-400 dark:text-gray-500 pt-2">
        <span>Clique para editar</span>
        <UIcon
          name="i-lucide-chevron-right"
          class="w-4 h-4 ml-1"
        />
      </div>
    </div>
  </UCard>
</template>
