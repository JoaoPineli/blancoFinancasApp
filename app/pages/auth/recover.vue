<script setup lang="ts">
/**
 * Password Recovery page.
 */

definePageMeta({
  layout: false
})

const validation = useValidation()
const toast = useToast()

const form = reactive({
  email: ''
})

const isLoading = ref(false)
const submitted = ref(false)

const emailError = computed(() => {
  if (!form.email) return ''
  return validation.validateEmail(form.email) ? '' : 'Email inválido'
})

async function handleSubmit() {
  if (!form.email || emailError.value) {
    return
  }

  isLoading.value = true

  // Mock: Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500))

  submitted.value = true
  isLoading.value = false

  toast.add({
    title: 'Email enviado!',
    description: 'Verifique sua caixa de entrada para redefinir sua senha.',
    color: 'success'
  })
}
</script>

<template>
  <UApp>
    <div class="min-h-screen flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-950">
      <div class="w-full max-w-md">
        <div class="text-center mb-8">
          <NuxtLink to="/">
            <AppLogo class="mx-auto" />
          </NuxtLink>
          <h1 class="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Recuperar senha
          </h1>
          <p class="mt-2 text-gray-600 dark:text-gray-400">
            Digite seu email para receber um link de recuperação.
          </p>
        </div>

        <UCard>
          <template v-if="!submitted">
            <form class="space-y-4" @submit.prevent="handleSubmit">
              <UFormField label="Email" :error="emailError" required>
                <UInput
                  v-model="form.email"
                  type="email"
                  placeholder="seu@email.com"
                  icon="i-lucide-mail"
                  autocomplete="email"
                />
              </UFormField>

              <UButton
                type="submit"
                color="primary"
                block
                size="lg"
                :loading="isLoading"
                :disabled="!form.email || !!emailError"
              >
                Enviar link de recuperação
              </UButton>

              <div class="text-center">
                <NuxtLink
                  to="/auth"
                  class="text-sm text-primary-600 hover:text-primary-500"
                >
                  Voltar para o login
                </NuxtLink>
              </div>
            </form>
          </template>

          <template v-else>
            <div class="text-center py-8">
              <div class="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <UIcon name="i-lucide-mail-check" class="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Email enviado!
              </h3>
              <p class="text-gray-600 dark:text-gray-400 mb-6">
                Enviamos um link de recuperação para <strong>{{ form.email }}</strong>.
                Verifique sua caixa de entrada.
              </p>
              <NuxtLink to="/auth">
                <UButton color="primary" variant="soft">
                  Voltar para o login
                </UButton>
              </NuxtLink>
            </div>
          </template>
        </UCard>
      </div>
    </div>
    <UNotifications />
  </UApp>
</template>
