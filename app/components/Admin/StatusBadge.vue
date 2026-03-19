<script setup lang="ts">
/**
 * StatusBadge component for Admin.
 * Displays client status with consistent styling.
 * Supports: active, inactive, defaulting, registered.
 */

defineProps<{
  status: string
}>()

function getStatusColor(status: string): 'success' | 'neutral' | 'error' | 'warning' {
  switch (status) {
    case 'active': return 'success'
    case 'inactive': return 'neutral'
    case 'defaulting': return 'error'
    case 'registered': return 'neutral'
    default: return 'neutral'
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'active': return 'Ativo'
    case 'inactive': return 'Inativo'
    case 'defaulting': return 'Inadimplente'
    case 'registered': return 'Registrado'
    default: return status
  }
}
</script>

<template>
  <UBadge
    :color="getStatusColor(status)"
    variant="subtle"
  >
    {{ getStatusLabel(status) }}
  </UBadge>
</template>
