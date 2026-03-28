<script setup lang="ts">
/**
 * NotificationsDropdown — admin bell icon with unread badge and popover listing.
 *
 * Per guardrails:
 * - Render-only: props + emits, no API calls.
 * - Clicking a notification navigates to /admin/withdrawals.
 */
import type { Notification } from '~/composables/useNotificationsApi'

const props = defineProps<{
  notifications: Notification[]
  unreadCount: number
  isLoading?: boolean
}>()

const emit = defineEmits<{
  (e: 'mark-as-read', id: string): void
  (e: 'mark-all-as-read'): void
}>()

const isOpen = ref(false)
const router = useRouter()

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'agora mesmo'
  if (minutes < 60) return `há ${minutes}min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `há ${hours}h`
  const days = Math.floor(hours / 24)
  return `há ${days}d`
}

function handleNotificationClick(notification: Notification) {
  if (!notification.isRead) {
    emit('mark-as-read', notification.id)
  }
  isOpen.value = false
  router.push('/admin/withdrawals')
}
</script>

<template>
  <div class="relative">
    <UPopover v-model:open="isOpen">
      <UButton
        icon="i-lucide-bell"
        color="neutral"
        variant="ghost"
        class="relative"
        aria-label="Notificações"
      >
        <!-- Unread badge -->
        <span
          v-if="unreadCount > 0"
          class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center"
        >
          {{ unreadCount > 99 ? '99+' : unreadCount }}
        </span>
      </UButton>

      <template #content>
        <div class="w-80 max-h-96 overflow-hidden flex flex-col">
          <!-- Header -->
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              Notificações
              <span
                v-if="unreadCount > 0"
                class="ml-1 text-xs text-gray-500 dark:text-gray-400"
              >({{ unreadCount }} não lidas)</span>
            </h3>
            <UButton
              v-if="unreadCount > 0"
              variant="ghost"
              size="xs"
              color="neutral"
              @click="emit('mark-all-as-read')"
            >
              Marcar todas como lidas
            </UButton>
          </div>

          <!-- Loading -->
          <div
            v-if="isLoading"
            class="p-4 space-y-2"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="h-12 rounded bg-gray-100 dark:bg-gray-800 animate-pulse"
            />
          </div>

          <!-- Notifications list -->
          <div
            v-else-if="notifications.length > 0"
            class="overflow-y-auto"
          >
            <button
              v-for="n in notifications"
              :key="n.id"
              class="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 last:border-0"
              :class="{ 'bg-blue-50 dark:bg-blue-900/10': !n.isRead }"
              @click="handleNotificationClick(n)"
            >
              <div class="shrink-0 mt-0.5">
                <div
                  class="w-2 h-2 rounded-full mt-1.5"
                  :class="n.isRead ? 'bg-transparent' : 'bg-blue-500'"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ n.title }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                  {{ n.message }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ formatTimeAgo(n.createdAt) }}
                </p>
              </div>
            </button>
          </div>

          <!-- Empty state -->
          <div
            v-else
            class="p-6 text-center"
          >
            <UIcon
              name="i-lucide-bell"
              class="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2"
            />
            <p class="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma notificação
            </p>
          </div>

          <!-- Footer link -->
          <div
            v-if="notifications.length > 0"
            class="border-t border-gray-200 dark:border-gray-700 px-4 py-2"
          >
            <NuxtLink
              to="/admin/withdrawals"
              class="text-xs text-primary-600 dark:text-primary-400 hover:underline"
              @click="isOpen = false"
            >
              Ver todos os saques →
            </NuxtLink>
          </div>
        </div>
      </template>
    </UPopover>
  </div>
</template>
