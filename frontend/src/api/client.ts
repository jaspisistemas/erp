import axios, { type InternalAxiosRequestConfig } from 'axios'
import { DEV_PORTS } from '@seja/shared'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './tokenManager'

const API_PORT = import.meta.env.VITE_API_PORT
  ? Number(import.meta.env.VITE_API_PORT)
  : DEV_PORTS.BACKEND
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${API_PORT}`
  }
  return `http://localhost:${API_PORT}`
}
export const API_URL = getApiUrl()

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

function getCurrentPath(): string {
  return window.location.pathname
}

function isAuthRoute(path: string): boolean {
  return path === '/login' || path === '/select-empresa' || path === '/select-module'
}

function decodeTokenPayload(token: string): { empCod?: number; activeCompanyId?: number; activeModuleId?: string; exp?: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function doLogoutAndRedirect(): void {
  const path = getCurrentPath()
  if (isAuthRoute(path)) return

  const token = getAccessToken()
  if (!token) {
    clearTokens()
    window.location.replace('/login')
    return
  }

  const payload = decodeTokenPayload(token)
  if (!payload) {
    clearTokens()
    window.location.replace('/login')
    return
  }

  const empCod = payload.empCod ?? payload.activeCompanyId ?? 0
  if (!empCod) {
    window.location.replace('/select-empresa')
    return
  }

  const activeModuleId = payload.activeModuleId ?? null
  if (!activeModuleId) {
    window.location.replace('/select-module')
    return
  }

  clearTokens()
  window.location.replace('/login')
}

async function refreshAccessToken(
  refreshToken: string,
  activeModuleId?: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const { data } = await axios.post<{ accessToken: string; refreshToken: string }>(
    `${API_URL}/auth/refresh`,
    { refreshToken, activeModuleId },
    { headers: { 'Content-Type': 'application/json' } },
  )
  return data
}

let isRefreshing = false
const refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb)
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token))
  refreshSubscribers.length = 0
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (axios.isAxiosError(error) && error.response?.status === 401) {
      if (originalRequest.url?.includes('/auth/refresh')) {
        doLogoutAndRedirect()
        return Promise.reject(error)
      }

      const refresh = getRefreshToken()
      if (!refresh) {
        doLogoutAndRedirect()
        return Promise.reject(error)
      }

      if (originalRequest._retry) {
        doLogoutAndRedirect()
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true
      originalRequest._retry = true

      try {
        const token = getAccessToken()
        const payload = token ? decodeTokenPayload(token) : null
        const activeModuleId = payload?.activeModuleId ?? undefined

        const { accessToken, refreshToken: newRefresh } = await refreshAccessToken(refresh, activeModuleId)
        setTokens(accessToken, newRefresh)
        onRefreshed(accessToken)

        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return apiClient(originalRequest)
      } catch {
        doLogoutAndRedirect()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
