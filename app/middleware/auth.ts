/**
 * Authentication middleware.
 * Protects /client and /admin routes.
 * Redirects REGISTERED users to /auth/confirm.
 * Per guardrails:
 * - Route protection is NOT authorization (backend must verify)
 * - Every privileged action must be authorized server-side
 */

export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth()

  // Initialize auth state if needed
  await auth.initialize()

  // Check if route requires authentication
  const isClientRoute = to.path.startsWith('/client')
  const isAdminRoute = to.path.startsWith('/admin')

  if (!isClientRoute && !isAdminRoute) {
    // Public route, allow access
    return
  }

  // User must be authenticated
  if (!auth.isAuthenticated.value) {
    return navigateTo('/auth')
  }

  // REGISTERED users must confirm their email first
  if (auth.isRegistered.value) {
    return navigateTo('/auth/confirm')
  }

  // Check role-based access
  if (isClientRoute && !auth.isClient.value) {
    // Admin trying to access client routes - redirect to admin
    return navigateTo('/admin/clients')
  }

  if (isAdminRoute && !auth.isAdmin.value) {
    // Client trying to access admin routes - redirect to client
    return navigateTo('/client/dashboard')
  }
})
