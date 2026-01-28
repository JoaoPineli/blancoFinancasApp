<script setup lang="ts">
/**
 * Account Activation Page.
 * Public page for completing account registration via invitation token.
 *
 * Per guardrails and requirements:
 * - Token read strictly from URL parameters, never stored persistently
 * - No client-side token validation
 * - No backend check on page load
 * - Generic error messages only
 * - No automatic login after activation
 * - All API calls go through useApi composable (Section 3.1)
 */

import type { FormError } from '@nuxt/ui'

definePageMeta({
  layout: false
})

const route = useRoute()
const validation = useValidation()
const toast = useToast()

// API composable without auth token - this is a public endpoint
// Per requirements: Do NOT send JWT or session credentials
const api = useApi({
  token: ref(null)
})

// Token read from URL parameter - kept only in memory
const token = computed(() => {
  const t = route.query.token
  return typeof t === 'string' ? t : null
})

// Page state
const isLoading = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)
const activationComplete = ref(false)

// Form state
const initialForm = {
  password: '',
  passwordConfirm: '',
  cpf: '',
  phone: '',
  nickname: ''
}

const form = reactive({ ...initialForm })

/**
 * Format CPF as user types (XXX.XXX.XXX-XX)
 */
function handleCpfInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.cpf = validation.formatCpf(target.value)
}

/**
 * Format phone as user types ((XX) XXXXX-XXXX)
 */
function formatPhone(value: string): string {
  const cleaned = value.replace(/\D/g, '').slice(0, 11)
  if (cleaned.length <= 2) return cleaned
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
}

function handlePhoneInput(event: Event) {
  const target = event.target as HTMLInputElement
  form.phone = formatPhone(target.value)
}

/**
 * Basic client-side validation for UX only.
 * Per guardrails: Frontend validation is not authoritative.
 */
type Schema = typeof form
function validateForm(state: Partial<Schema>): FormError[] {
  const errors: FormError[] = []

  // Password required
  if (!state.password || !state.password.trim()) {
    errors.push({ name: 'password', message: 'Senha é obrigatória' })
  } else if (state.password.length < 8) {
    errors.push({ name: 'password', message: 'Senha deve ter pelo menos 8 caracteres' })
  }

  // Password confirmation required and must match
  if (!state.passwordConfirm || !state.passwordConfirm.trim()) {
    errors.push({ name: 'passwordConfirm', message: 'Confirmação de senha é obrigatória' })
  } else if (state.password !== state.passwordConfirm) {
    errors.push({ name: 'passwordConfirm', message: 'As senhas não coincidem' })
  }

  // CPF required
  if (!state.cpf || !state.cpf.trim()) {
    errors.push({ name: 'cpf', message: 'CPF é obrigatório' })
  } else if (!validation.validateCpf(state.cpf)) {
    errors.push({ name: 'cpf', message: 'CPF inválido' })
  }

  // Phone required
  const cleanedPhone = state.phone?.replace(/\D/g, '') || ''
  if (!cleanedPhone) {
    errors.push({ name: 'phone', message: 'Telefone é obrigatório' })
  } else if (cleanedPhone.length < 10 || cleanedPhone.length > 11) {
    errors.push({ name: 'phone', message: 'Telefone inválido' })
  }

  // Nickname is optional - no validation needed

  return errors
}

/**
 * Handle form submission.
 * Sends activation request to backend with token in payload.
 * Per guardrails Section 3.1: All API calls go through useApi composable.
 * Per requirements: Token is NOT sent as Authorization header.
 */
async function handleSubmit(event: { data: Schema }) {
  if (!token.value) return

  isLoading.value = true

  // Send activation request with token in payload
  // Per requirements: NOT using Bearer token or JWT (api configured with null token)
  const { error } = await api.post('/v1/auth/activate', {
    token: token.value,
    password: event.data.password,
    cpf: event.data.cpf.replace(/\D/g, ''), // Send cleaned CPF
    phone: event.data.phone.replace(/\D/g, ''), // Send cleaned phone
    nickname: event.data.nickname?.trim() || null
  })

  isLoading.value = false

  if (error) {
    // Generic error message - per requirements, do not differentiate error types
    toast.add({
      title: 'Erro na ativação',
      description: 'Não foi possível ativar sua conta. Por favor, tente novamente ou entre em contato com o suporte.',
      color: 'error'
    })
    return
  }

  // Success
  activationComplete.value = true
  toast.add({
    title: 'Conta ativada!',
    description: 'Sua conta foi ativada com sucesso. Você será redirecionado para o login.',
    color: 'success'
  })

  // Redirect to login after brief delay
  setTimeout(() => {
    navigateTo('/auth')
  }, 3000)
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex">
      <!-- Left side - Form -->
      <div class="flex-1 flex items-center justify-center px-8">
        <div class="w-full max-w-md">
          <!-- Missing token error -->
          <template v-if="!token">
            <div class="text-center">
              <UIcon
                name="i-lucide-alert-circle"
                class="w-16 h-16 text-red-500 mx-auto mb-4"
              />
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Link inválido
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                O link de ativação está incompleto ou inválido.
                Por favor, verifique o link recebido por email.
              </p>
              <UButton
                to="/auth"
                color="primary"
              >
                Ir para Login
              </UButton>
            </div>
          </template>

          <!-- Activation complete -->
          <template v-else-if="activationComplete">
            <div class="text-center">
              <UIcon
                name="i-lucide-check-circle"
                class="w-16 h-16 text-green-500 mx-auto mb-4"
              />
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Conta ativada!
              </h1>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Sua conta foi ativada com sucesso.
                Você será redirecionado para a página de login.
              </p>
              <UButton
                to="/auth"
                color="primary"
              >
                Ir para Login
              </UButton>
            </div>
          </template>

          <!-- Activation form -->
          <template v-else>
            <div class="text-center mb-8">
              <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
                Complete seu cadastro
              </h1>
              <p class="mt-2 text-gray-600 dark:text-gray-400">
                Preencha os dados abaixo para ativar sua conta.
              </p>
            </div>

            <UCard>
              <UForm
                :state="form"
                :validate="validateForm"
                class="space-y-4"
                @submit="handleSubmit"
              >
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

                <UFormField
                  name="passwordConfirm"
                  label="Confirmar senha"
                  required
                >
                  <UInput
                    v-model="form.passwordConfirm"
                    :type="showPasswordConfirm ? 'text' : 'password'"
                    placeholder="Digite a senha novamente"
                    icon="i-lucide-lock"
                    autocomplete="new-password"
                    class="w-full"
                  >
                    <template #trailing>
                      <UButton
                        :icon="showPasswordConfirm ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                        color="neutral"
                        variant="ghost"
                        size="xs"
                        @click="showPasswordConfirm = !showPasswordConfirm"
                      />
                    </template>
                  </UInput>
                </UFormField>

                <UFormField
                  name="cpf"
                  label="CPF"
                  required
                >
                  <UInput
                    :model-value="form.cpf"
                    placeholder="000.000.000-00"
                    icon="i-lucide-id-card"
                    autocomplete="off"
                    class="w-full"
                    @input="handleCpfInput"
                  />
                </UFormField>

                <UFormField
                  name="phone"
                  label="Telefone"
                  required
                >
                  <UInput
                    :model-value="form.phone"
                    placeholder="(00) 00000-0000"
                    icon="i-lucide-phone"
                    autocomplete="tel"
                    class="w-full"
                    @input="handlePhoneInput"
                  />
                </UFormField>

                <UFormField
                  name="nickname"
                  label="Apelido"
                  hint="Opcional"
                >
                  <UInput
                    v-model="form.nickname"
                    placeholder="Como gostaria de ser chamado?"
                    icon="i-lucide-smile"
                    autocomplete="nickname"
                    class="w-full"
                  />
                </UFormField>

                <UButton
                  type="submit"
                  color="primary"
                  block
                  size="lg"
                  :loading="isLoading"
                  :disabled="isLoading"
                >
                  Ativar Conta
                </UButton>
              </UForm>
            </UCard>
          </template>
        </div>
      </div>

      <!-- Right side - Decorative -->
      <div class="hidden lg:flex flex-1 bg-primary-600 items-center justify-center p-8">
        <div class="text-center text-white">
          <UIcon
            name="i-lucide-user-check"
            class="w-24 h-24 mb-6 opacity-80"
          />
          <h2 class="text-3xl font-bold mb-4">
            Bem-vindo ao Blanco Finanças
          </h2>
          <p class="text-lg opacity-80 max-w-md">
            Complete seu cadastro para começar a investir com segurança e transparência.
          </p>
        </div>
      </div>
    </div>
    <UNotifications />
  </UApp>
</template>

<style scoped>
</style>
