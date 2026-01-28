/**
 * Authentication and session management composable.
 * Per guardrails: Tokens stored only in cookies with proper security flags.
 */

export type UserRole = 'client' | 'admin'

export interface User {
  id: string
  name: string
  role: UserRole
  email: string
  cpfCnpj: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export function useAuth() {
  const token = useCookie<string | null>('auth_token', {
    secure: true,
    sameSite: 'strict',
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

  /**
   * Login user and store session.
   * Note: In production, this would call the backend.
   * Currently uses mock data for development.
   */
  async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
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
      const authUser = {
        id: data.user_id,
        name: data.name,
        role: data.role,
        email: 'teste@teste.com',
        cpfCnpj: '12345678901'
      }
      user.value = authUser

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
   */
  async function initialize(): Promise<void> {
    if (token.value && !user.value) {
      // Mock: restore user from token
      // In production, this would validate the token with the backend
      if (token.value === 'mock_client_token_123') {
        user.value = {
          id: '1',
          name: 'João Silva',
          email: 'cliente@blanco.com',
          cpfCnpj: '123.456.789-00',
          role: 'client'
        }
      } else if (token.value === 'mock_admin_token_456') {
        user.value = {
          id: '2',
          name: 'Maria Admin',
          email: 'admin@blanco.com',
          cpfCnpj: '987.654.321-00',
          role: 'admin'
        }
      } else {
        // Invalid token - force logout
        logout()
      }
    }
  }

  return {
    token: readonly(token),
    user: readonly(user),
    isAuthenticated,
    isClient,
    isAdmin,
    login,
    logout,
    initialize
  }
}
