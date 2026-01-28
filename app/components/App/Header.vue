<script setup lang="ts">
defineProps<{
  variant: 'client' | 'admin'
}>()

const auth = useAuth()

async function handleLogout() {
  auth.logout()
  await navigateTo('/auth')
}
</script>

<template>
  <header class="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 flex items-center justify-between">
    <div class="flex items-center gap-4">
      <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
        {{ variant === 'client' ? 'Portal do Cliente' : 'Painel Administrativo' }}
      </h1>
    </div>

    <div class="flex items-center gap-4">
      <UColorModeButton />

      <div class="flex items-center gap-3">
        <div class="text-right">
          <p class="text-sm font-medium text-gray-900 dark:text-white">
            {{ auth.user.value?.name }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ auth.user.value?.email }}
          </p>
        </div>

        <UDropdownMenu
          :items="[
            [{
              label: 'Sair',
              icon: 'i-lucide-log-out',
              onSelect: handleLogout
            }]
          ]"
        >
          <UButton
            icon="i-lucide-user"
            color="neutral"
            variant="ghost"
            class="rounded-full"
          />
        </UDropdownMenu>
      </div>
    </div>
  </header>
</template>
