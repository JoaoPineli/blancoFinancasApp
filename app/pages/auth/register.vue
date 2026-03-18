<script setup lang="ts">
/**
 * Self-registration page.
 * Collects full name, nickname, email, password, confirm password, phone, CPF.
 *
 * Uses UForm + validate function pattern (same as AddPlanModal / NewSubscriptionModal)
 * so that validation errors only appear after the user submits, not on load.
 */

import type { FormError } from '@nuxt/ui'

definePageMeta({
  layout: false
})

const validation = useValidation()
const toast = useToast()

const api = useApi({
  token: ref(null),
  onUnauthorized: () => {}
})

const form = reactive({
  name: '',
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  cpf: ''
})

const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)

type FormSchema = typeof form

function validateForm(state: Partial<FormSchema>): FormError[] {
  const errors: FormError[] = []

  if (!state.name || state.name.length < 2) {
    errors.push({ name: 'name', message: 'Nome deve ter ao menos 2 caracteres' })
  }
  if (!state.email || !validation.validateEmail(state.email)) {
    errors.push({ name: 'email', message: 'Email inválido' })
  }
  if (!state.cpf || !validation.validateCpf(state.cpf)) {
    errors.push({ name: 'cpf', message: 'CPF inválido' })
  }
  const phoneCleaned = (state.phone || '').replace(/\D/g, '')
  if (phoneCleaned.length < 10) {
    errors.push({ name: 'phone', message: 'Telefone inválido' })
  }
  if (!state.password || state.password.length < 8) {
    errors.push({ name: 'password', message: 'Senha deve ter ao menos 8 caracteres' })
  }
  if (!state.confirmPassword || state.password !== state.confirmPassword) {
    errors.push({ name: 'confirmPassword', message: 'As senhas não conferem' })
  }

  return errors
}

function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11)
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
}

function onPhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.phone = formatPhone(target.value)
}

function onCpfInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.cpf = validation.formatCpf(target.value)
}

async function handleRegister() {
  isLoading.value = true

  try {
    const { data, error: apiError } = await api.post<{
      id: string
      email: string
      name: string
      message: string
    }>('/v1/auth/register', {
      name: form.name,
      nickname: form.nickname || undefined,
      email: form.email,
      password: form.password,
      phone: form.phone.replace(/\D/g, ''),
      cpf: form.cpf
    })

    if (apiError) {
      toast.add({
        title: 'Erro no registro',
        description: apiError.message || 'Não foi possível completar o registro.',
        color: 'error'
      })
      return
    }

    if (data) {
      toast.add({
        title: 'Registro realizado!',
        description: data.message || 'Verifique seu email para confirmar sua conta.',
        color: 'success'
      })
      await navigateTo('/auth')
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex">
      <!-- Left side - Decorative -->
      <div class="hidden lg:flex flex-1 bg-primary-600 items-center justify-center p-8">
        <div class="text-center text-white">
          <UIcon
            name="i-lucide-user-plus"
            class="w-24 h-24 mb-6 opacity-80"
          />
          <h2 class="text-3xl font-bold mb-4">
            Crie sua conta
          </h2>
          <p class="text-lg opacity-80 max-w-md">
            Registre-se e comece a investir com segurança e transparência.
          </p>
        </div>
      </div>

      <!-- Right side - Form -->
      <div class="flex-1 flex items-center justify-center px-8 py-12">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              Registre-se
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Preencha os dados abaixo para criar sua conta.
            </p>
          </div>

          <UCard>
            <UForm
              :state="form"
              :validate="validateForm"
              class="space-y-4"
              @submit="handleRegister"
            >
              <!-- Name -->
              <UFormField
                name="name"
                label="Nome completo"
                required
              >
                <UInput
                  v-model="form.name"
                  placeholder="Seu nome completo"
                  icon="i-lucide-user"
                  autocomplete="name"
                  class="w-full"
                />
              </UFormField>

              <!-- Nickname -->
              <UFormField
                name="nickname"
                label="Apelido"
              >
                <UInput
                  v-model="form.nickname"
                  placeholder="Como gostaria de ser chamado (opcional)"
                  icon="i-lucide-smile"
                  class="w-full"
                />
              </UFormField>

              <!-- Email -->
              <UFormField
                name="email"
                label="Email"
                required
              >
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="seu@email.com"
                  icon="i-lucide-mail"
                  autocomplete="email"
                  class="w-full"
                />
              </UFormField>

              <!-- CPF -->
              <UFormField
                name="cpf"
                label="CPF"
                required
              >
                <UInput
                  :model-value="form.cpf"
                  placeholder="000.000.000-00"
                  icon="i-lucide-id-card"
                  maxlength="14"
                  class="w-full"
                  @input="onCpfInput"
                />
              </UFormField>

              <!-- Phone -->
              <UFormField
                name="phone"
                label="Telefone"
                required
              >
                <UInput
                  :model-value="form.phone"
                  placeholder="(00) 00000-0000"
                  icon="i-lucide-phone"
                  maxlength="15"
                  class="w-full"
                  @input="onPhoneInput"
                />
              </UFormField>

              <!-- Password -->
              <UFormField
                name="password"
                label="Senha"
                required
              >
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Mínimo 8 caracteres"
                  icon="i-lucide-lock"
                  autocomplete="new-password"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="showPassword = !showPassword"
                    />
                  </template>
                </UInput>
              </UFormField>

              <!-- Confirm Password -->
              <UFormField
                name="confirmPassword"
                label="Confirmar senha"
                required
              >
                <UInput
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  placeholder="Repita a senha"
                  icon="i-lucide-lock"
                  autocomplete="new-password"
                  class="w-full"
                >
                  <template #trailing>
                    <UButton
                      :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                      color="neutral"
                      variant="ghost"
                      size="xs"
                      @click="showConfirmPassword = !showConfirmPassword"
                    />
                  </template>
                </UInput>
              </UFormField>

              <UButton
                type="submit"
                color="primary"
                block
                size="lg"
                :loading="isLoading"
              >
                Registrar
              </UButton>
            </UForm>
          </UCard>

          <p class="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            <NuxtLink
              to="/auth"
              class="text-primary-600 hover:text-primary-500 font-medium"
            >
              Já tem uma conta? Faça login
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
    <UToast />
  </UApp>
</template>

<style scoped>
</style>
