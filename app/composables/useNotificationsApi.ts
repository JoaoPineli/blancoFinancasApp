/**
 * Admin notifications API composable.
 * Handles notification listing, unread count, and marking as read.
 *
 * Per guardrails:
 * - All HTTP interactions go through useApi
 * - Components receive data via props — no API calls inside components
 */

// ------------------------------------------------------------------
// API response types
// ------------------------------------------------------------------

export interface NotificationApiResponse {
  id: string
  notification_type: string
  title: string
  message: string
  is_read: boolean
  target_id: string | null
  target_type: string | null
  data: Record<string, unknown>
  created_at: string
  read_at: string | null
}

export interface NotificationListApiResponse {
  notifications: NotificationApiResponse[]
  total: number
  unread_count: number
}

// ------------------------------------------------------------------
// Frontend-friendly type (camelCase)
// ------------------------------------------------------------------

export interface Notification {
  id: string
  notificationType: string
  title: string
  message: string
  isRead: boolean
  targetId: string | null
  targetType: string | null
  data: Record<string, unknown>
  createdAt: string
  readAt: string | null
}

// ------------------------------------------------------------------
// Mapper
// ------------------------------------------------------------------

function toNotification(r: NotificationApiResponse): Notification {
  return {
    id: r.id,
    notificationType: r.notification_type,
    title: r.title,
    message: r.message,
    isRead: r.is_read,
    targetId: r.target_id,
    targetType: r.target_type,
    data: r.data,
    createdAt: r.created_at,
    readAt: r.read_at
  }
}

// ------------------------------------------------------------------
// Composable
// ------------------------------------------------------------------

export function useNotificationsApi() {
  const api = useApi()

  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const isLoading = ref(false)

  async function fetchUnreadCount(): Promise<void> {
    const response = await api.get<{ unread_count: number }>(
      '/v1/admin/notifications/unread-count'
    )
    if (response.data) {
      unreadCount.value = response.data.unread_count
    }
  }

  async function fetchNotifications(unreadOnly = false): Promise<void> {
    isLoading.value = true

    const response = await api.get<NotificationListApiResponse>(
      '/v1/admin/notifications',
      { unread_only: unreadOnly, limit: 10 }
    )

    if (response.data) {
      notifications.value = response.data.notifications.map(toNotification)
      unreadCount.value = response.data.unread_count
    }

    isLoading.value = false
  }

  async function markAsRead(id: string): Promise<void> {
    const response = await api.patch<NotificationApiResponse>(
      `/v1/admin/notifications/${id}/read`,
      {}
    )
    if (response.data) {
      const idx = notifications.value.findIndex(n => n.id === id)
      if (idx !== -1) {
        notifications.value[idx] = toNotification(response.data)
      }
      if (unreadCount.value > 0) unreadCount.value--
    }
  }

  async function markAllAsRead(): Promise<void> {
    await api.post('/v1/admin/notifications/mark-all-read', {})
    notifications.value = notifications.value.map(n => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    unreadCount.value = 0
  }

  return {
    notifications,
    unreadCount,
    isLoading,
    fetchUnreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  }
}
