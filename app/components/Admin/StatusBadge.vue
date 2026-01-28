<script setup lang="ts">
/**
 * StatusBadge component for Admin.
 * Displays client status with consistent styling.
 */

defineProps<{
  status: 'active' | 'inactive' | 'defaulting'
}>()

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'neutral'
    case 'defaulting':
      return 'error'
    default:
      return 'neutral'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return 'Ativo'
    case 'inactive':
      return 'Inativo'
    case 'defaulting':
      return 'Inadimplente'
    default:
      return status
  }
}
</script>

<template>
  <UBadge :color="getStatusColor(status)" variant="subtle">
    {{ getStatusLabel(status) }}
  </UBadge>
</template>
