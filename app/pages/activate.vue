<script setup lang="ts">
/**
 * Account activation page.
 * Handles email confirmation when user clicks the link from the confirmation email.
 * Simplified: just validates the token, no form needed (all user data set at registration).
 */

definePageMeta({
  layout: false
})

const route = useRoute()
const toast = useToast()

const api = useApi({
  token: ref(null),
  onUnauthorized: () => {}
})

const isActivating = ref(true)
const activationSuccess = ref(false)
const activationError = ref('')

async function activateAccount(token: string) {
  isActivating.value = true

  try {
    const { data, error: apiError } = await api.post<{
      user_id: string
      email: string
      name: string
      message: string
    }>('/v1/auth/activate', {
      token
    })

    if (apiError) {
      activationError.value = apiError.message || 'Token inválido ou expirado.'
      return
    }

    if (data) {
      activationSuccess.value = true
      toast.add({
        title: 'Conta ativada!',
        description: 'Sua conta foi confirmada com sucesso. Faça login para continuar.',
        color: 'success'
      })
    }
  } finally {
    isActivating.value = false
  }
}

onMounted(() => {
  const token = route.query.token as string
  if (token) {
    activateAccount(token)
  } else {
    isActivating.value = false
    activationError.value = 'Token de ativação não encontrado.'
  }
})
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <UCard>
          <div class="text-center space-y-6 py-4">
            <!-- Loading -->
            <template v-if="isActivating">
              <div class="mx-auto w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                <UIcon
                  name="i-lucide-loader-2"
                  class="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin"
                />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Ativando sua conta...
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  Aguarde enquanto confirmamos seu email.
                </p>
              </div>
            </template>

            <!-- Success -->
            <template v-else-if="activationSuccess">
              <div class="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <UIcon
                  name="i-lucide-check-circle"
                  class="w-8 h-8 text-green-600 dark:text-green-400"
                />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Conta ativada!
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  Sua conta foi confirmada com sucesso. Faça login para continuar.
                </p>
              </div>
              <UButton
                to="/auth"
                color="primary"
                block
                size="lg"
              >
                Ir para o login
              </UButton>
            </template>

            <!-- Error -->
            <template v-else>
              <div class="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                <UIcon
                  name="i-lucide-x-circle"
                  class="w-8 h-8 text-red-600 dark:text-red-400"
                />
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                  Erro na ativação
                </h1>
                <p class="mt-2 text-gray-600 dark:text-gray-400">
                  {{ activationError }}
                </p>
              </div>
              <div class="space-y-3">
                <UButton
                  to="/auth"
                  color="primary"
                  block
                  size="lg"
                >
                  Ir para o login
                </UButton>
              </div>
            </template>
          </div>
        </UCard>
      </div>
    </div>
    <UToast />
  </UApp>
</template>

<style scoped>
</style>
