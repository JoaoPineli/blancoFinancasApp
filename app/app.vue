<script setup lang="ts">
useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'pt-BR'
  }
})

const title = 'Blanco Finanças'
const description = 'Plataforma de investimentos com rendimentos seguros e transparentes para você alcançar seus objetivos financeiros.'

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  twitterCard: 'summary_large_image'
})

const route = useRoute()

const isPublicRoute = computed(() => {
  return route.path === '/' || route.path.startsWith('/auth')
})

const isClientRoute = computed(() => {
  return route.path.startsWith('/client')
})

const isAdminRoute = computed(() => {
  return route.path.startsWith('/admin')
})
</script>

<template>
  <UApp>
    <!-- Public layout -->
    <template v-if="isPublicRoute">
      <UHeader>
        <template #left>
          <NuxtLink to="/">
            <AppLogo class="h-8 w-auto" />
          </NuxtLink>
        </template>

        <template #right>
          <UColorModeButton />
          <UButton
            to="/auth"
            color="primary"
            variant="solid"
          >
            Entrar
          </UButton>
        </template>
      </UHeader>

      <UMain>
        <NuxtPage />
      </UMain>

      <UFooter>
        <template #left>
          <p class="text-sm text-muted">
            © {{ new Date().getFullYear() }} Blanco Finanças. Todos os direitos reservados.
          </p>
        </template>
      </UFooter>
    </template>

    <!-- Client layout -->
    <template v-else-if="isClientRoute">
      <div class="flex min-h-screen">
        <AppSidebar variant="client" />
        <div class="flex-1 flex flex-col">
          <AppHeader variant="client" />
          <UMain class="p-6">
            <NuxtPage />
          </UMain>
        </div>
      </div>
    </template>

    <!-- Admin layout -->
    <template v-else-if="isAdminRoute">
      <div class="flex min-h-screen">
        <AppSidebar variant="admin" />
        <div class="flex-1 flex flex-col">
          <AppHeader variant="admin" />
          <UMain class="p-6">
            <NuxtPage />
          </UMain>
        </div>
      </div>
    </template>

    <!-- Fallback -->
    <template v-else>
      <UMain>
        <NuxtPage />
      </UMain>
    </template>

    <UToaster />
  </UApp>
</template>
