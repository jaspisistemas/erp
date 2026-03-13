import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'
import {
  clearTokens,
  getAccessToken,
  getAuthUserName,
  getRefreshToken,
  getTokenPayload,
  hasValidTokens,
  setAuthUserName,
  setTokens,
} from '../../api/tokenManager'
import { API_URL } from '../../api/client'
import { selectCompany as selectCompanyApi } from '../../api/empresasApi'
import { selectModule as selectModuleApi } from '../../api/authApi'

type LoginResponse = {
  accessToken: string
  refreshToken: string
  nextStep?: 'dashboard' | 'select-company'
  user?: {
    pesCod?: number
    empCod?: number
    filCod?: number
    name?: string
    email?: string
    prfTip?: number
    userKind?: 'usuario' | 'suporte'
    userPesExtCod?: number
    isSuporte?: boolean
  }
}

export interface AuthState {
  isAuthenticated: boolean
  token: string | null
  refreshToken: string | null
  user: {
    pesCod: number
    empCod: number
    filCod?: number
    name: string
    email: string
    prfTip?: number
    userKind?: 'usuario' | 'suporte'
    userPesExtCod?: number
    isSuporte?: boolean
  } | null
  activeModuleId: string | null
  loading: boolean
  error: string | null
}

function getInitialAuthState(): AuthState {
  const accessToken = getAccessToken()
  const refresh = getRefreshToken()
  if (!accessToken || !refresh) {
    return {
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      user: null,
      activeModuleId: null,
      loading: false,
      error: null,
    }
  }
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      return {
        isAuthenticated: false,
        token: null,
        refreshToken: null,
        user: null,
        activeModuleId: null,
        loading: false,
        error: null,
      }
    }
    const empCod = payload.empCod ?? payload.activeCompanyId ?? 0
    const persistedName = getAuthUserName()
    return {
      isAuthenticated: true,
      token: accessToken,
      refreshToken: refresh,
      user: {
        pesCod: payload.sub,
        empCod,
        name: persistedName || '',
        email: payload.email ?? '',
        prfTip: payload.prfTip,
      },
      activeModuleId: payload.activeModuleId ?? null,
      loading: false,
      error: null,
    }
  } catch {
    return {
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      user: null,
      activeModuleId: null,
      loading: false,
      error: null,
    }
  }
}

const initialState: AuthState = getInitialAuthState()

export const login = createAsyncThunk(
  'auth/login',
  async (payload: { username: string; password: string }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post<LoginResponse>(`${API_URL}/auth/login`, {
        user: payload.username,
        password: payload.password,
      })

      setTokens(data.accessToken, data.refreshToken)
      return data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      let baseMsg = err.response?.data?.message || err.message || 'Erro ao autenticar'
      if (baseMsg === 'Network Error') {
        baseMsg = 'Não conseguimos conectar ao sistema agora.'
      }
      const hint = !err.response ? ' Verifique sua conexão e tente novamente.' : ''
      return rejectWithValue(baseMsg + hint)
    }
  },
)

export const selectModule = createAsyncThunk(
  'auth/selectModule',
  async (moduleId: string, { rejectWithValue }) => {
    try {
      const data = await selectModuleApi(moduleId)
      setTokens(data.accessToken, data.refreshToken)
      return { ...data, activeModuleId: moduleId || null }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.message || err.message || 'Erro ao selecionar módulo')
    }
  },
)

export const selectCompany = createAsyncThunk(
  'auth/selectCompany',
  async (payload: { empCod: number; filCod?: number }, { rejectWithValue }) => {
    try {
      const data = await selectCompanyApi(payload)
      setTokens(data.accessToken, data.refreshToken)
      return { ...data, empCod: payload.empCod, filCod: payload.filCod }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.message || err.message || 'Erro ao trocar de empresa')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state: AuthState) {
      state.isAuthenticated = false
      state.token = null
      state.refreshToken = null
      state.user = null
      state.activeModuleId = null
      state.loading = false
      state.error = null
      clearTokens()
    },
    syncFromToken(state: AuthState) {
      const payload = getTokenPayload()
      if (payload?.activeModuleId && !state.activeModuleId) {
        state.activeModuleId = payload.activeModuleId
      }
    },
    checkTokensValidity(state: AuthState) {
      if (state.isAuthenticated && !hasValidTokens()) {
        state.isAuthenticated = false
        state.token = null
        state.refreshToken = null
        state.user = null
        clearTokens()
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.isAuthenticated = true
        state.token = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        const userName = action.payload.user?.name ?? ''
        state.user = {
          pesCod: action.payload.user?.pesCod ?? 0,
          empCod: action.payload.user?.empCod ?? 0,
          filCod: action.payload.user?.filCod,
          name: userName,
          email: action.payload.user?.email ?? '',
          prfTip: action.payload.user?.prfTip,
          userKind: action.payload.user?.userKind,
          userPesExtCod: action.payload.user?.userPesExtCod,
          isSuporte: action.payload.user?.isSuporte,
        }
        state.activeModuleId = getTokenPayload()?.activeModuleId ?? 'dashboard'
        setAuthUserName(userName)
      })
      .addCase(selectModule.fulfilled, (state, action) => {
        state.token = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        state.activeModuleId = action.payload.activeModuleId
      })
      .addCase(selectCompany.fulfilled, (state, action) => {
        state.token = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken || null
        state.activeModuleId = getTokenPayload()?.activeModuleId ?? 'dashboard'
        if (state.user && action.payload.empCod != null) {
          state.user.empCod = action.payload.empCod
          if (action.payload.filCod != null) {
            state.user.filCod = action.payload.filCod
          }
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = (action.payload as string) || 'Falha no login'
      })
  },
})

export const { logout, checkTokensValidity, syncFromToken } = authSlice.actions
export default authSlice.reducer
