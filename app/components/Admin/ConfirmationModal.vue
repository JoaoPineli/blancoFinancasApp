<script setup lang="ts">
/**
 * Reusable confirmation modal component.
 * Per guardrails:
 * - Presentation-only, emits user intent
 * - No business logic or entity awareness
 */

const props = withDefaults(defineProps<{
  open: boolean
  title: string
  description?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmColor?: 'primary' | 'success' | 'warning' | 'error' | 'neutral'
  icon?: string
  iconColorClass?: string
  iconBgClass?: string
  loading?: boolean
}>(), {
  description: undefined,
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  confirmColor: 'primary',
  icon: 'i-lucide-alert-triangle',
  iconColorClass: 'text-gray-600 dark:text-gray-400',
  iconBgClass: 'bg-gray-100 dark:bg-gray-900/30',
  loading: false
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value)
})

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <UModal v-model:open="isOpen">
    <template #content>
      <UCard>
        <template #header>
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full"
              :class="iconBgClass"
            >
              <UIcon
                :name="icon"
                class="w-5 h-5"
                :class="iconColorClass"
              />
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ title }}
              </h3>
              <p
                v-if="description"
                class="text-sm text-gray-500 dark:text-gray-400"
              >
                {{ description }}
              </p>
            </div>
          </div>
        </template>

        <p class="text-gray-600 dark:text-gray-300">
          <!-- eslint-disable-next-line vue/no-v-html -->
          <span v-html="message" />
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="outline"
              :disabled="loading"
              @click="handleCancel"
            >
              {{ cancelLabel }}
            </UButton>
            <UButton
              :color="confirmColor"
              :loading="loading"
              @click="handleConfirm"
            >
              {{ confirmLabel }}
            </UButton>
          </div>
        </template>
      </UCard>
    </template>
  </UModal>
</template>
