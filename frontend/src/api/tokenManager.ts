let accessToken: string | null = null
let refreshToken: string | null = null

try {
  const at = localStorage.getItem('accessToken')
  const rt = localStorage.getItem('refreshToken')
  accessToken = at || null
  refreshToken = rt || null
} catch {
  /* ignore */
}

export const setTokens = (access: string | null, refresh?: string | null) => {
  accessToken = access
  if (refresh !== undefined) refreshToken = refresh
  try {
    if (access !== undefined) {
      if (access) localStorage.setItem('accessToken', access)
      else localStorage.removeItem('accessToken')
    }
    if (refresh !== undefined) {
      if (refresh) localStorage.setItem('refreshToken', refresh)
      else localStorage.removeItem('refreshToken')
    }
  } catch {
    /* no-op */
  }
}

export const getAccessToken = () => {
  if (accessToken) return accessToken
  try {
    return localStorage.getItem('accessToken')
  } catch {
    return null
  }
}

export const getTokenPayload = (): { activeModuleId?: string; empCod?: number; activeCompanyId?: number; exp?: number } | null => {
  const t = getAccessToken()
  if (!t) return null
  try {
    return JSON.parse(atob(t.split('.')[1]))
  } catch {
    return null
  }
}

export const getRefreshToken = () => {
  if (refreshToken) return refreshToken
  try {
    return localStorage.getItem('refreshToken')
  } catch {
    return null
  }
}

export const clearTokens = () => {
  accessToken = null
  refreshToken = null
  try {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('authUserName')
  } catch {
    /* no-op */
  }
}

export const setAuthUserName = (name: string) => {
  try {
    if (name) localStorage.setItem('authUserName', name)
    else localStorage.removeItem('authUserName')
  } catch {
    /* no-op */
  }
}

export const getAuthUserName = (): string => {
  try {
    return localStorage.getItem('authUserName') ?? ''
  } catch {
    return ''
  }
}

export const hasValidTokens = (): boolean => {
  const access = getAccessToken()
  const refresh = getRefreshToken()
  if (!access || !refresh) return false
  try {
    const payload = JSON.parse(atob(access.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp > now) return true
    return true
  } catch {
    return false
  }
}
