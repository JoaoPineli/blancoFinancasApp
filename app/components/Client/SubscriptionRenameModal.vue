<script setup lang="ts">
/**
 * SubscriptionRenameModal — simple modal to rename a subscription.
 * Emits 'renamed' with the new name on success.
 * Per guardrails: no API calls in components — calls composable via emit.
 */

const props = defineProps<{
  open: boolean
  subscriptionId: string
  currentName: string
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', payload: { subscriptionId: string, name: string }): void
}>()

const name = ref(props.currentName)
const isSaving = ref(false)

watch(() => props.currentName, (val) => {
  name.value = val
})

watch(() => props.open, (val) => {
  if (val) name.value = props.currentName
})

function close() {
  emit('update:open', false)
}

async function save() {
  const trimmed = name.value.trim()
  if (!trimmed) return
  isSaving.value = true
  emit('save', { subscriptionId: props.subscriptionId, name: trimmed })
  isSaving.value = false
}
</script>

<template>
  <UModal
    :open="open"
    title="Alterar nome da poupança"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <UFormField label="Nome">
          <UInput
            v-model="name"
            placeholder="Nome da poupança"
            autofocus
            @keydown.enter="save"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UButton
          variant="ghost"
          color="neutral"
          @click="close"
        >
          Cancelar
        </UButton>
        <UButton
          :loading="isSaving"
          :disabled="!name.trim()"
          @click="save"
        >
          Salvar
        </UButton>
      </div>
    </template>
  </UModal>
</template>
