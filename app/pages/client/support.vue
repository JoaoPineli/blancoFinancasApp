<script setup lang="ts">
/**
 * Client Support page.
 * Contact channels and FAQ section.
 * Per guardrails: uses Nuxt UI components, no external dependencies.
 */

definePageMeta({
  middleware: ['auth']
})

const toast = useToast()

interface FaqItem {
  Title: string
  Text: string
}

/**
 * FAQ items — single source of truth.
 * To add a new question, append an object with { Title, Text } to this array.
 */
const faqItems: FaqItem[] = [
  {
    Title: 'Como funciona o investimento na Blanco?',
    Text: 'Ao aderir a um plano, você realiza depósitos mensais via Pix. O rendimento é calculado com base na poupança e creditado automaticamente na sua conta. Todos os valores podem ser acompanhados pelo painel.'
  },
  {
    Title: 'Como faço para solicitar um saque?',
    Text: 'Acesse a página Financeiro, selecione a aba Saque, preencha os dados bancários e o valor desejado. A solicitação será analisada e processada em até 3 dias úteis após aprovação.'
  },
  {
    Title: 'O que é o Fundo Garantidor?',
    Text: 'O Fundo Garantidor é uma reserva equivalente a um percentual de cada depósito, destinada a proteger o seu investimento. Ele é retido automaticamente e pode ser consultado no seu extrato.'
  },
  {
    Title: 'Posso ter mais de um plano ativo?',
    Text: 'Sim. Você pode assinar múltiplos planos simultaneamente, inclusive do mesmo tipo, cada um com parâmetros e prazos independentes.'
  },
  {
    Title: 'Como acompanho meus rendimentos?',
    Text: 'No Dashboard você encontra um resumo com saldo total, rendimento do mês e próximo pagamento. O histórico detalhado está disponível na página Financeiro.'
  },
  {
    Title: 'Como entro em contato com o suporte?',
    Text: 'Você pode nos contatar pelo e-mail suporte@blancofinancas.com ou pelo telefone (11) 99999-9999, de segunda a sexta, das 9h às 18h.'
  }
]

const accordionItems = faqItems.map((item, index) => ({
  label: item.Title,
  content: item.Text,
  value: `faq-${index}`
}))

async function copyEmail() {
  try {
    await navigator.clipboard.writeText('suporte@blancofinancas.com')
    toast.add({
      title: 'E-mail copiado!',
      description: 'O endereço foi copiado para a área de transferência.',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Erro ao copiar',
      description: 'Não foi possível copiar o e-mail.',
      color: 'error'
    })
  }
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        Suporte
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        Tire suas dúvidas ou entre em contato com nossa equipe de atendimento.
      </p>
    </div>

    <UCard>
      <template #header>
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <UIcon
              name="i-lucide-headphones"
              class="w-5 h-5 text-primary-600 dark:text-primary-400"
            />
          </div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
            Contato
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Contate o suporte da blanco através dos seguintes canais:
            </p>
          </h2>
        </div>
      </template>

      <div class="space-y-5">
        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <UIcon
              name="i-lucide-mail"
              class="w-5 h-5 text-primary-600 dark:text-primary-400"
            />
          </div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
            <a
              href="mailto:suporte@blancofinancas.com"
              class="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 break-all"
            >
              suporte@blancofinancas.com
            </a>
            <UButton
              size="xs"
              variant="ghost"
              color="neutral"
              icon="i-lucide-copy"
              aria-label="Copiar e-mail"
              @click="copyEmail"
            />
          </div>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <UIcon
              name="i-lucide-phone"
              class="w-5 h-5 text-primary-600 dark:text-primary-400"
            />
          </div>
          <a
            href="tel:+5511999999999"
            class="text-sm font-medium text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
          >
            (11) 99999-9999
          </a>
        </div>

        <div class="flex items-center gap-4">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
            <UIcon
              name="i-lucide-clock"
              class="w-5 h-5 text-primary-600 dark:text-primary-400"
            />
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            Seg-Sex: 9h às 18h
          </span>
        </div>
      </div>
    </UCard>

    <UCard>
      <template #header>
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
          Perguntas frequentes
        </h2>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Confira as dúvidas mais comuns sobre a plataforma.
        </p>
      </template>

      <UAccordion :items="accordionItems" />
    </UCard>
  </div>
</template>
