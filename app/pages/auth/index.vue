<script setup lang="ts">
/**
 * Login page.
 * Per guardrails:
 * - Must differentiate between Client and Admin redirection
 * - Inputs must be masked/validated
 */

definePageMeta({
  layout: false
})

const auth = useAuth()
const validation = useValidation()
const toast = useToast()

const form = reactive({
  email: '',
  password: ''
})

const isLoading = ref(false)
const showPassword = ref(false)

const emailError = computed(() => {
  if (!form.email) return ''
  return validation.validateEmail(form.email) ? '' : 'Email inválido'
})

async function handleLogin() {
  if (!form.email || !form.password || emailError.value) {
    return
  }

  isLoading.value = true

  try {
    const result = await auth.login(form.email, form.password)

    if (result.success) {
      toast.add({
        title: 'Login realizado!',
        description: 'Redirecionando...',
        color: 'success'
      })

      // Redirect based on role
      if (auth.isAdmin.value) {
        await navigateTo('/admin/clients')
      } else {
        await navigateTo('/client/dashboard')
      }
    } else {
      toast.add({
        title: 'Erro no login',
        description: result.error || 'Credenciais inválidas.',
        color: 'error'
      })
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex">
      <!-- Left side - Form -->
      <div class="flex-1 flex items-center justify-center px-8">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
              Bem-vindo
            </h1>
            <p class="mt-2 text-gray-600 dark:text-gray-400">
              Entre com suas credenciais para acessar sua conta.
            </p>
            <p class="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Se você ainda não possui uma conta, entre em contato com o administrador.
            </p>
          </div>

          <UCard>
            <form
              class="space-y-4"
              @submit.prevent="handleLogin"
            >
              <UFormField
                label="Email"
                :error="emailError"
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

              <UFormField
                label="Senha"
                required
              >
                <UInput
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  icon="i-lucide-lock"
                  autocomplete="current-password"
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

              <div class="flex items-center justify-between">
                <UCheckbox label="Lembrar de mim" />
                <!-- <NuxtLink
                  to="/auth/recover"
                  class="text-sm text-primary-600 hover:text-primary-500"
                >
                  Esqueceu a senha?
                </NuxtLink> -->
              </div>

              <UButton
                type="submit"
                color="primary"
                block
                size="lg"
                :loading="isLoading"
                :disabled="!form.email || !form.password || !!emailError"
              >
                Entrar
              </UButton>
            </form>
          </UCard>

          <!-- Dev hint -->
          <UAlert
            class="mt-4"
            icon="i-lucide-info"
            color="info"
            variant="subtle"
            title="Credenciais de teste"
          >
            <template #description>
              <p class="text-sm">
                Cliente: <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">cliente@blanco.com</code><br>
                Admin: <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">admin@blanco.com</code><br>
                Senha: qualquer valor
              </p>
            </template>
          </UAlert>
        </div>
      </div>

      <!-- Right side - Decorative -->
      <div class="hidden lg:flex flex-1 bg-primary-600 items-center justify-center p-8">
        <div class="text-center text-white">
          <UIcon
            name="i-lucide-trending-up"
            class="w-24 h-24 mb-6 opacity-80"
          />
          <h2 class="text-3xl font-bold mb-4">
            Invista com segurança
          </h2>
          <p class="text-lg opacity-80 max-w-md">
            Acompanhe seus investimentos, rendimentos e faça saques de forma simples e transparente.
          </p>
        </div>
      </div>
    </div>
    <UToast />
  </UApp>
</template>

<style scoped>
</style>
