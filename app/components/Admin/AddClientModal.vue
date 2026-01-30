<script setup lang="ts">
/**
 * AddClientModal component for Admin.
 * Modal to add a new client/user to the system.
 * Per guardrails:
 * - Frontend validation is for UX only, not authoritative
 * - Components emit user intent (events), do not perform business logic
 */

import type { FormError } from '@nuxt/ui'
import type { PlanSummary } from '~/composables/usePlansApi'

const props = defineProps<{
  plans: readonly PlanSummary[]
}>()

const emit = defineEmits<{
  (e: 'submit', data: NewClientData): void
  (e: 'close'): void
}>()

const open = defineModel<boolean>('open', { default: false })

interface NewClientData {
  name: string
  email: string
  planId: string
}

const { validateEmail } = useValidation()

const initialForm = {
  name: '',
  email: '',
  planId: ''
}

const form = reactive({ ...initialForm })

const isLoading = ref(false)

// Transform plans into dropdown options
const planOptions = computed(() =>
  props.plans.map(plan => ({
    value: plan.id,
    label: plan.title
  }))
)

type Schema = typeof form
function validateForm(form: Partial<Schema>): FormError[] {
  const errors: FormError[] = []
  // Name validation
  if (!form.name || !form.name.trim()) errors.push({ name: 'name', message: 'Nome é obrigatório' })
  else if (form.name.trim().length < 3) errors.push({ name: 'name', message: 'Nome deve ter pelo menos 3 caracteres' })

  // Email validation
  if (!form.email || !form.email.trim()) errors.push({ name: 'email', message: 'Email é obrigatório' })
  else if (!validateEmail(form.email)) errors.push({ name: 'email', message: 'Email inválido' })

  // Plan validation
  if (!form.planId) errors.push({ name: 'planId', message: 'Plano é obrigatório' })
  return errors
}

function resetForm() {
  Object.assign(form, initialForm)
}

function handleSubmit(event: { data: Schema }) {
  isLoading.value = true
  const data = {
    name: event.data.name.trim(),
    email: event.data.email.trim(),
    planId: event.data.planId
  }

  try {
    emit('submit', data)
  } finally {
    resetForm()
    isLoading.value = false
    open.value = false
  }
}

function handleClose() {
  resetForm()
  emit('close')
  open.value = false
}

watch(open, (value) => {
  if (!value) {
    resetForm()
  }
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="'Adicionar Novo Cliente'"
    :description="'Preencha os dados do cliente para cadastrá-lo no sistema.'"
  >
    <template #body>
      <UForm
        :state="form"
        :validate="validateForm"
        class="space-y-4"
        @submit="handleSubmit"
      >
        <UFormField
          name="name"
          label="Nome completo"
          required
        >
          <UInput
            v-model="form.name"
            placeholder="Digite o nome completo"
            icon="i-lucide-user"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="email"
          label="Email"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            placeholder="email@exemplo.com"
            icon="i-lucide-mail"
            class="w-full"
          />
        </UFormField>

        <UFormField
          name="planId"
          label="Plano"
          required
        >
          <USelect
            v-model="form.planId"
            :items="planOptions"
            placeholder="Selecione o plano"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4">
          <UButton
            type="button"
            color="neutral"
            variant="ghost"
            @click="handleClose"
          >
            Cancelar
          </UButton>
          <UButton
            type="submit"
            color="primary"
            :loading="isLoading"
          >
            <UIcon
              name="i-lucide-user-plus"
              class="w-4 h-4 mr-2"
            />
            Adicionar Cliente
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
