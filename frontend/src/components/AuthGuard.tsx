import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../redux/hooks'
import { getAccessToken } from '../api/tokenManager'
import { apiClient } from '../api/client'

type TokenPayload = {
  sub?: number
  empCod?: number
  activeCompanyId?: number
  filCod?: number
  prfTip?: number
  activeModuleId?: string
  exp?: number
}

function decodeTokenPayload(token: string): TokenPayload | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

function hasValidToken(token: string | null): { ok: boolean; payload: TokenPayload | null } {
  if (!token) return { ok: false, payload: null }

  const payload = decodeTokenPayload(token)
  if (!payload) return { ok: false, payload: null }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp != null && payload.exp < now) {
    return { ok: false, payload: null }
  }

  return { ok: true, payload }
}

function useSessionCheck(enabled: boolean): 'checking' | 'ok' | 'invalid' {
  const [status, setStatus] = useState<'checking' | 'ok' | 'invalid'>(enabled ? 'checking' : 'ok')

  useEffect(() => {
    let cancelled = false

    if (!enabled) {
      setStatus('ok')
      return () => { cancelled = true }
    }

    setStatus('checking')
    apiClient.get('/auth/empresas-com-acesso')
      .then(() => {
        if (!cancelled) setStatus('ok')
      })
      .catch(() => {
        if (!cancelled) setStatus('invalid')
      })

    return () => { cancelled = true }
  }, [enabled])

  return status
}

export const AuthGuardFull: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)
  const tokenValidation = useMemo(() => hasValidToken(getAccessToken()), [location.pathname])
  const sessionStatus = useSessionCheck(tokenValidation.ok)

  if (!tokenValidation.ok) return <Navigate to="/login" state={{ from: location }} replace />
  if (sessionStatus === 'checking') return null
  if (sessionStatus === 'invalid') return <Navigate to="/login" state={{ from: location }} replace />

  const payload = tokenValidation.payload
  const empCod = payload?.empCod ?? payload?.activeCompanyId ?? user?.empCod ?? 0
  const filCod = payload?.filCod ?? user?.filCod ?? 0
  const pesCod = user?.pesCod ?? payload?.sub ?? 0
  const prfTip = user?.prfTip ?? payload?.prfTip
  const isSupportUser = prfTip === 3

  if (empCod <= 0 || filCod <= 0) {
    return <Navigate to="/select-empresa" state={{ from: location }} replace />
  }

  if (pesCod === 0 && !isSupportUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export const AuthGuardToken: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const tokenValidation = useMemo(() => hasValidToken(getAccessToken()), [location.pathname])
  const sessionStatus = useSessionCheck(tokenValidation.ok)

  if (!tokenValidation.ok) return <Navigate to="/login" state={{ from: location }} replace />
  if (sessionStatus === 'checking') return null
  if (sessionStatus === 'invalid') return <Navigate to="/login" state={{ from: location }} replace />

  return <>{children}</>
}

export const AuthGuardWithEmpresa: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)
  const tokenValidation = useMemo(() => hasValidToken(getAccessToken()), [location.pathname])
  const sessionStatus = useSessionCheck(tokenValidation.ok)

  if (!tokenValidation.ok) return <Navigate to="/login" state={{ from: location }} replace />
  if (sessionStatus === 'checking') return null
  if (sessionStatus === 'invalid') return <Navigate to="/login" state={{ from: location }} replace />

  const payload = tokenValidation.payload
  const empCod = payload?.empCod ?? payload?.activeCompanyId ?? user?.empCod ?? 0
  const filCod = payload?.filCod ?? user?.filCod ?? 0
  const pesCod = user?.pesCod ?? payload?.sub ?? 0
  const prfTip = user?.prfTip ?? payload?.prfTip
  const isSupportUser = prfTip === 3

  if (empCod <= 0 || filCod <= 0) {
    return <Navigate to="/select-empresa" state={{ from: location }} replace />
  }

  if (pesCod === 0 && !isSupportUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}
