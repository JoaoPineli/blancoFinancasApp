/**
 * Centralized API gateway composable.
 * All HTTP interactions must go through this composable.
 * Per architecture guardrails: Direct useFetch calls in pages/components are forbidden.
 */

export interface ApiError {
  code: string
  message: string
  httpStatus: number
}

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

interface UseApiOptions {
  onUnauthorized?: () => void
  onForbidden?: () => void
  token?: Ref<string | null>
}

export function useApi(options: UseApiOptions = {}) {
  const config = useRuntimeConfig()
  const baseUrl = config.public.apiBaseUrl as string
  const toast = useToast()
  const token = options.token ?? useCookie<string | null>('auth_token')
  const onUnauthorized = options.onUnauthorized
  const onForbidden = options.onForbidden

  /**
   * Normalizes any error into the standard ApiError shape.
   */
  function normalizeError(err: unknown, status: number = 500): ApiError {
    if (err && typeof err === 'object' && 'message' in err) {
      return {
        code: 'code' in err ? String(err.code) : 'UNKNOWN_ERROR',
        message: String(err.message),
        httpStatus: status
      }
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'Ocorreu um erro inesperado.',
      httpStatus: status
    }
  }

  /**
   * Handles authentication failures as per guardrails:
   * - 401: Invalidate session, redirect to login
   * - 403: Display authorization error
   */
  function handleAuthError(status: number): void {
    if (status === 401) {
      onUnauthorized?.()
      toast.add({
        title: 'Sessão expirada',
        description: 'Sua sessão expirou. Por favor, faça login novamente.',
        color: 'error'
      })
      navigateTo('/auth')
    } else if (status === 403) {
      onForbidden?.()
      toast.add({
        title: 'Acesso negado',
        description: 'Você não tem permissão para realizar esta ação.',
        color: 'error'
      })
    }
  }

  /**
   * Makes an authenticated request to the API.
   */
  async function request<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: Record<string, unknown>
      query?: Record<string, string | number | boolean | undefined>
    } = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, query } = options
    try {
      const response = await $fetch<T>(`${baseUrl}${endpoint}`, {
        method,
        body,
        query,
        headers: token.value ? { Authorization: `Bearer ${token.value}` } : {}
      })

      return { data: response, error: null }
    } catch (err: unknown) {
      const status = (err as { statusCode?: number })?.statusCode || 500

      // Handle auth failures centrally
      if (status === 401 || status === 403) {
        handleAuthError(status)
      }

      const error = normalizeError(err, status)
      return { data: null, error }
    }
  }

  return {
    request,
    get: <T>(endpoint: string, query?: Record<string, string | number | boolean | undefined>) =>
      request<T>(endpoint, { method: 'GET', query }),
    post: <T>(endpoint: string, body?: Record<string, unknown>) =>
      request<T>(endpoint, { method: 'POST', body }),
    put: <T>(endpoint: string, body?: Record<string, unknown>) =>
      request<T>(endpoint, { method: 'PUT', body }),
    patch: <T>(endpoint: string, body?: Record<string, unknown>) =>
      request<T>(endpoint, { method: 'PATCH', body }),
    delete: <T>(endpoint: string) =>
      request<T>(endpoint, { method: 'DELETE' })
  }
}
