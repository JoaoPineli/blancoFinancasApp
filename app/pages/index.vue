<script setup lang="ts">
/**
 * Landing page for Blanco Finanças.
 * Public page showcasing the platform.
 */

const features = [
  {
    icon: 'i-lucide-shield-check',
    title: 'Segurança Garantida',
    description: 'Seus investimentos protegidos pelo Fundo de proteção e práticas de segurança rigorosas.'
  },
  {
    icon: 'i-lucide-trending-up',
    title: 'Rendimentos Consistentes',
    description: 'Acompanhe seus rendimentos mensais de forma transparente e previsível.'
  },
  {
    icon: 'i-lucide-zap',
    title: 'Operações Rápidas',
    description: 'Depósitos via Pix e saques processados em até 3 dias úteis.'
  },
  {
    icon: 'i-lucide-headphones',
    title: 'Suporte Dedicado',
    description: 'Equipe de atendimento pronta para ajudar você a qualquer momento.'
  },
  {
    icon: 'i-lucide-file-text',
    title: 'Contratos Claros',
    description: 'Documentação transparente com todas as condições do seu investimento.'
  },
  {
    icon: 'i-lucide-smartphone',
    title: 'Acesso Total',
    description: 'Gerencie seus investimentos de qualquer lugar, a qualquer hora.'
  }
]

const plans = [
  {
    name: 'Plano Geral',
    description: 'Ideal para todos os perfis de investidor.',
    minInvestment: 'R$ 1.000,00',
    yield: '1,5% ao mês',
    term: '12 meses'
  },
  {
    name: 'Pequeno Agricultor',
    description: 'Condições especiais para pequenos agricultores.',
    minInvestment: 'R$ 500,00',
    yield: '1,8% ao mês',
    term: '24 meses',
    highlight: true
  }
]
</script>

<template>
  <div>
    <!-- Hero Section -->
    <UPageHero
      title="Invista no seu futuro com segurança"
      description="A Blanco Finanças oferece investimentos com rendimentos mensais transparentes e segurança garantida. Comece a investir hoje e alcance seus objetivos financeiros."
      :links="[
        {
          label: 'Começar agora',
          to: '/auth',
          trailingIcon: 'i-lucide-arrow-right',
          size: 'xl'
        },
        {
          label: 'Conhecer planos',
          to: '#planos',
          size: 'xl',
          color: 'neutral',
          variant: 'subtle'
        }
      ]"
    />

    <!-- Features Section -->
    <UPageSection
      id="recursos"
      title="Por que escolher a Blanco Finanças?"
      description="Oferecemos uma plataforma completa para você investir com tranquilidade e acompanhar seus rendimentos de forma transparente."
      :features="features"
    />

    <!-- Plans Section -->
    <UPageSection
      id="planos"
      title="Nossos Planos de Investimento"
      description="Escolha o plano que melhor se adapta ao seu perfil e objetivos financeiros."
    >
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        <UCard
          v-for="plan in plans"
          :key="plan.name"
          :class="{ 'ring-2 ring-primary-500': plan.highlight }"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
                {{ plan.name }}
              </h3>
              <UBadge v-if="plan.highlight" color="primary">
                Popular
              </UBadge>
            </div>
          </template>

          <div class="space-y-4">
            <p class="text-gray-600 dark:text-gray-400">
              {{ plan.description }}
            </p>

            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Investimento mínimo</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ plan.minInvestment }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Rendimento</span>
                <span class="font-medium text-green-600 dark:text-green-400">{{ plan.yield }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500 dark:text-gray-400">Prazo</span>
                <span class="font-medium text-gray-900 dark:text-white">{{ plan.term }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <NuxtLink to="/auth" class="w-full">
              <UButton
                :color="plan.highlight ? 'primary' : 'neutral'"
                :variant="plan.highlight ? 'solid' : 'soft'"
                block
              >
                Começar a investir
              </UButton>
            </NuxtLink>
          </template>
        </UCard>
      </div>
    </UPageSection>

    <!-- How it Works Section -->
    <UPageSection
      id="como-funciona"
      title="Como funciona"
      description="Invista em poucos passos e comece a ver seus rendimentos."
    >
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">1</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Cadastre-se</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Crie sua conta em poucos minutos com seus dados básicos.
          </p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">2</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Escolha seu plano</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Selecione o plano que melhor se adapta ao seu perfil.
          </p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">3</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Faça seu depósito</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Deposite via Pix de forma rápida e segura.
          </p>
        </div>

        <div class="text-center">
          <div class="w-16 h-16 mx-auto mb-4 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
            <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">4</span>
          </div>
          <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Acompanhe</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Veja seus rendimentos crescerem mês a mês.
          </p>
        </div>
      </div>
    </UPageSection>

    <!-- CTA Section -->
    <UPageSection>
      <UPageCTA
        title="Pronto para começar a investir?"
        description="Junte-se a milhares de investidores que já confiam na Blanco Finanças. Crie sua conta gratuitamente e comece hoje mesmo."
        variant="subtle"
        :links="[
          {
            label: 'Criar minha conta',
            to: '/auth',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'primary'
          }
        ]"
      />
    </UPageSection>
  </div>
</template>
