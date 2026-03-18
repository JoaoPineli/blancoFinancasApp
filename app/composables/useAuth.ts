/**
 * Authentication and session management composable.
 * Per guardrails: Tokens stored only in cookies with proper security flags.
 */

export type UserRole = 'client' | 'admin'
export type UserStatus = 'registered' | 'active' | 'inactive' | 'defaulting'

export interface User {
  id: string
  name: string
  role: UserRole
  email: string
  cpfCnpj: string
  status: UserStatus
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export function useAuth() {
  const runtimeConfig = useRuntimeConfig()
  const apiBase = runtimeConfig.public.apiBase
  const isProduction = typeof apiBase === 'string' && apiBase.startsWith('https')

  const token = useCookie<string | null>('auth_token', {
    secure: isProduction, // Only require secure in production (HTTPS)
    sameSite: 'lax', // 'lax' allows cookie to persist on navigation
    maxAge: 60 * 60 * 24 * 7 // 7 days
  })

  const api = useApi({
    token,
    onUnauthorized: () => logout()
  })
  // Token stored in cookie with security flags per guardrails

  // User state - cleared on logout
  const user = useState<User | null>('auth_user', () => null)

  const isAuthenticated = computed(() => !!token.value && !!user.value)

  const isClient = computed(() => user.value?.role === 'client')

  const isAdmin = computed(() => user.value?.role === 'admin')

  const isRegistered = computed(() => user.value?.status === 'registered')

  const isActive = computed(() => user.value?.status === 'active')

  /**
   * Login user and store session.
   */
  async function login(email: string, password: string): Promise<{ success: boolean, error?: string }> {
    type LoginResponse = {
      access_token: string
      token_type: string
      user_id: string
      role: UserRole
      name: string
    }

    const { data, error: apiError } = await api.post<LoginResponse>('/v1/auth/login', {
      email,
      password: password.trim()
    })

    if (apiError) {
      return {
        success: false,
        error: apiError.message || 'Erro ao conectar com o servidor.'
      }
    }

    if (data) {
      if (!data.access_token || !data.user_id) {
        return {
          success: false,
          error: 'Resposta inválida do servidor.'
        }
      }

      token.value = data.access_token

      // After login, fetch full profile to get status
      await initialize()

      return { success: true }
    }

    return {
      success: false,
      error: 'Não foi possível autenticar. Tente novamente.'
    }
  }

  /**
   * Logout and clear all session data.
   * Per guardrails: Must clear all sensitive data on logout.
   */
  function logout(): void {
    token.value = null
    user.value = null
  }

  /**
   * Initialize auth state from cookie.
   * Called on app mount to restore session.
   * Validates the token with the backend to restore user data.
   */
  async function initialize(): Promise<void> {
    if (token.value && !user.value) {
      // Validate token with backend and fetch user profile
      const { data, error: apiError } = await api.get<{
        id: string
        name: string
        email: string
        cpf: string
        role: UserRole
        status: UserStatus
      }>('/v1/auth/me')

      if (apiError || !data) {
        // Token is invalid or expired - force logout
        logout()
        return
      }

      // Restore user from backend response
      user.value = {
        id: data.id,
        name: data.name,
        email: data.email,
        cpfCnpj: data.cpf,
        role: data.role,
        status: data.status
      }
    }
  }

  return {
    token: readonly(token),
    user: readonly(user),
    isAuthenticated,
    isClient,
    isAdmin,
    isRegistered,
    isActive,
    login,
    logout,
    initialize
  }
}
