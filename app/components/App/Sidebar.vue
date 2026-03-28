<script setup lang="ts">
const props = defineProps<{
  variant: 'client' | 'admin'
}>()

const clientNavItems = [
  {
    label: 'Dashboard',
    icon: 'i-lucide-layout-dashboard',
    to: '/client/dashboard'
  },
  {
    label: 'Planos',
    icon: 'i-lucide-file-text',
    to: '/client/plans'
  },
  {
    label: 'Financeiro',
    icon: 'i-lucide-wallet',
    to: '/client/finance'
  },
  {
    label: 'Suporte',
    icon: 'i-lucide-message-circle',
    to: '/client/support'
  }
]

const adminNavItems = [
  {
    label: 'Clientes',
    icon: 'i-lucide-users',
    to: '/admin/clients'
  },
  {
    label: 'Financeiro',
    icon: 'i-lucide-bar-chart-3',
    to: '/admin/finance'
  },
  {
    label: 'Relatórios',
    icon: 'i-lucide-file-spreadsheet',
    to: '/admin/reports'
  },
  {
    label: 'Planos',
    icon: 'i-lucide-clipboard-list',
    to: '/admin/plans'
  },
  {
    label: 'Saques',
    icon: 'i-lucide-arrow-up-right',
    to: '/admin/withdrawals'
  }
]

const navItems = computed(() =>
  props.variant === 'client' ? clientNavItems : adminNavItems
)

const route = useRoute()

function isActive(path: string): boolean {
  return route.path === path
}
</script>

<template>
  <aside class="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
    <!-- Logo -->
    <div class="h-16 px-4 flex items-center border-b border-gray-200 dark:border-gray-800">
      <NuxtLink to="/">
        <AppLogo />
      </NuxtLink>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 p-4 space-y-1">
      <NuxtLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
        :class="[
          isActive(item.to)
            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        ]"
      >
        <UIcon
          :name="item.icon"
          class="w-5 h-5"
        />
        {{ item.label }}
      </NuxtLink>
    </nav>

    <!-- Footer -->
    <div class="p-4 border-t border-gray-200 dark:border-gray-800">
      <p class="text-xs text-gray-500 dark:text-gray-400">
        © {{ new Date().getFullYear() }} Blanco Finanças
      </p>
    </div>
  </aside>
</template>
