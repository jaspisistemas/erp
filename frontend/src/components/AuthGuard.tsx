import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../redux/hooks'
import { getAccessToken } from '../api/tokenManager'

function decodeTokenPayload(token: string): { empCod?: number; activeCompanyId?: number; activeModuleId?: string; exp?: number } | null {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch {
    return null
  }
}

export const AuthGuardFull: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { user, activeModuleId } = useAppSelector((s) => s.auth)
  const token = getAccessToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const payload = decodeTokenPayload(token)
  if (!payload) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp != null && payload.exp < now) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const empCod = payload.empCod ?? payload.activeCompanyId ?? user?.empCod ?? 0
  if (!empCod) {
    return <Navigate to="/select-empresa" state={{ from: location }} replace />
  }

  const modId = payload.activeModuleId ?? activeModuleId ?? null
  if (!modId) {
    return <Navigate to="/select-module" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export const AuthGuardToken: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const token = getAccessToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const payload = decodeTokenPayload(token)
  if (!payload) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp != null && payload.exp < now) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export const AuthGuardWithEmpresa: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation()
  const { user } = useAppSelector((s) => s.auth)
  const token = getAccessToken()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const payload = decodeTokenPayload(token)
  if (!payload) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp != null && payload.exp < now) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const empCod = payload.empCod ?? payload.activeCompanyId ?? user?.empCod ?? 0
  if (!empCod) {
    return <Navigate to="/select-empresa" state={{ from: location }} replace />
  }

  return <>{children}</>
}
