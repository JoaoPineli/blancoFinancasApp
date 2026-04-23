<script setup lang="ts">
/**
 * Email confirmation page.
 * Shown to REGISTERED users who haven't confirmed their email yet.
 */

definePageMeta({
  layout: false
})

const auth = useAuth()
const toast = useToast()

const api = useApi({
  token: useCookie<string | null>('auth_token'),
  onUnauthorized: () => auth.logout()
})

const isResending = ref(false)
const resendCooldown = ref(0)
let cooldownInterval: ReturnType<typeof setInterval> | null = null

async function handleResend() {
  if (isResending.value || resendCooldown.value > 0) return

  isResending.value = true

  try {
    const { error: apiError } = await api.post<{ message: string }>('/v1/auth/resend-confirmation', {})

    if (apiError) {
      toast.add({
        title: 'Erro',
        description: apiError.message || 'Não foi possível reenviar o email.',
        color: 'error'
      })
      return
    }

    toast.add({
      title: 'Email reenviado!',
      description: 'Verifique sua caixa de entrada.',
      color: 'success'
    })

    // Start 60-second cooldown
    resendCooldown.value = 60
    cooldownInterval = setInterval(() => {
      resendCooldown.value--
      if (resendCooldown.value <= 0 && cooldownInterval) {
        clearInterval(cooldownInterval)
        cooldownInterval = null
      }
    }, 1000)
  } finally {
    isResending.value = false
  }
}

function handleLogout() {
  auth.logout()
  navigateTo('/auth')
}

onBeforeUnmount(() => {
  if (cooldownInterval) {
    clearInterval(cooldownInterval)
  }
})
</script>

<template>
  <UApp>
    <div class="flex-1 flex items-center justify-center px-4">
      <div class="w-full max-w-md">
        <UCard>
          <div class="text-center space-y-6 py-4">
            <div class="mx-auto w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
              <UIcon
                name="i-lucide-mail-check"
                class="w-8 h-8 text-primary-600 dark:text-primary-400"
              />
            </div>

            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                Confirme seu email
              </h1>
              <p class="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed">
                Enviamos um email de confirmação para o endereço cadastrado.
                Clique no link do email para ativar sua conta.
              </p>
            </div>

            <div class="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
              <div class="flex gap-3">
                <UIcon
                  name="i-lucide-info"
                  class="w-5 h-5 text-warning-600 dark:text-warning-400 shrink-0 mt-0.5"
                />
                <p class="text-sm text-warning-700 dark:text-warning-300">
                  Verifique também a pasta de spam ou lixo eletrônico caso não encontre o email na caixa de entrada.
                </p>
              </div>
            </div>

            <div class="space-y-3">
              <UButton
                color="primary"
                variant="soft"
                block
                size="lg"
                :loading="isResending"
                :disabled="resendCooldown > 0"
                @click="handleResend"
              >
                <template v-if="resendCooldown > 0">
                  Reenviar em {{ resendCooldown }}s
                </template>
                <template v-else>
                  Reenviar email de confirmação
                </template>
              </UButton>

              <UButton
                color="neutral"
                variant="ghost"
                block
                @click="handleLogout"
              >
                Sair
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </div>
    <UToast />
  </UApp>
</template>

<style scoped>
</style>
