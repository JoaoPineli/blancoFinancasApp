<script setup lang="ts">
/**
 * Client Support page.
 * Chat interface using Nuxt UI components.
 */

definePageMeta({
  middleware: ['auth']
})

const { chatMessages } = useMockData()
const auth = useAuth()

const messages = ref([...chatMessages])
const newMessage = ref('')
const isLoading = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

async function sendMessage() {
  if (!newMessage.value.trim()) return

  const content = newMessage.value.trim()
  newMessage.value = ''
  isLoading.value = true

  // Add user message
  messages.value.push({
    id: `msg-${Date.now()}`,
    senderId: auth.user.value?.id || 'unknown',
    senderName: auth.user.value?.name || 'Você',
    content,
    sentAt: new Date().toISOString(),
    isAdmin: false
  })

  // Scroll to bottom
  await nextTick()
  scrollToBottom()

  // Mock: Simulate admin response after delay
  await new Promise(resolve => setTimeout(resolve, 1500))

  messages.value.push({
    id: `msg-${Date.now()}-response`,
    senderId: 'admin-1',
    senderName: 'Suporte Blanco',
    content: 'Obrigado pela sua mensagem! Um de nossos atendentes irá responder em breve.',
    sentAt: new Date().toISOString(),
    isAdmin: true
  })

  isLoading.value = false
  await nextTick()
  scrollToBottom()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function formatTime(date: string): string {
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  scrollToBottom()
})
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Suporte
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Tire suas dúvidas com nossa equipe de atendimento.
      </p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Chat -->
      <div class="lg:col-span-2">
        <UCard class="h-150 flex flex-col">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                <UIcon
                  name="i-lucide-headphones"
                  class="w-5 h-5 text-primary-600 dark:text-primary-400"
                />
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  Suporte Blanco
                </p>
                <p class="text-sm text-green-500">
                  Online
                </p>
              </div>
            </div>
          </template>

          <!-- Messages -->
          <div
            ref="messagesContainer"
            class="flex-1 overflow-y-auto space-y-4 p-4"
          >
            <div
              v-for="message in messages"
              :key="message.id"
              class="flex"
              :class="message.isAdmin ? 'justify-start' : 'justify-end'"
            >
              <div
                class="max-w-[80%] rounded-lg px-4 py-2"
                :class="message.isAdmin
                  ? 'bg-gray-100 dark:bg-gray-800'
                  : 'bg-primary-500 text-white'"
              >
                <p class="text-sm">
                  {{ message.content }}
                </p>
                <p
                  class="text-xs mt-1"
                  :class="message.isAdmin
                    ? 'text-gray-500 dark:text-gray-400'
                    : 'text-primary-100'"
                >
                  {{ formatTime(message.sentAt) }}
                </p>
              </div>
            </div>

            <div
              v-if="isLoading"
              class="flex justify-start"
            >
              <div class="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2">
                <div class="flex gap-1">
                  <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style="animation-delay: 0.1s"
                  />
                  <div
                    class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style="animation-delay: 0.2s"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Input -->
          <div class="border-t border-gray-200 dark:border-gray-800 p-4">
            <form
              class="flex gap-2"
              @submit.prevent="sendMessage"
            >
              <UInput
                v-model="newMessage"
                placeholder="Digite sua mensagem..."
                class="flex-1"
                :disabled="isLoading"
              />
              <UButton
                type="submit"
                icon="i-lucide-send"
                color="primary"
                :disabled="!newMessage.trim() || isLoading"
              />
            </form>
          </div>
        </UCard>
      </div>

      <!-- Help Topics -->
      <div class="space-y-4">
        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Tópicos Frequentes
            </h3>
          </template>

          <div class="space-y-2">
            <UButton
              variant="ghost"
              color="neutral"
              block
              class="justify-start"
              icon="i-lucide-help-circle"
            >
              Como funciona o investimento?
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              block
              class="justify-start"
              icon="i-lucide-wallet"
            >
              Dúvidas sobre saque
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              block
              class="justify-start"
              icon="i-lucide-file-text"
            >
              Sobre meu contrato
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              block
              class="justify-start"
              icon="i-lucide-shield"
            >
              Segurança da conta
            </UButton>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <h3 class="font-semibold text-gray-900 dark:text-white">
              Outros Canais
            </h3>
          </template>

          <div class="space-y-3">
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-mail"
                class="w-5 h-5 text-gray-400"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                suporte@blancofinancas.com
              </span>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-phone"
                class="w-5 h-5 text-gray-400"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                (11) 99999-9999
              </span>
            </div>
            <div class="flex items-center gap-3">
              <UIcon
                name="i-lucide-clock"
                class="w-5 h-5 text-gray-400"
              />
              <span class="text-sm text-gray-600 dark:text-gray-400">
                Seg-Sex: 9h às 18h
              </span>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </div>
</template>
