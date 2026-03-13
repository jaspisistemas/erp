import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { fetchMenu as fetchMenuApi, fetchSideMenu as fetchSideMenuApi } from '../../api/menuApi'
import type { MenuDto, SideMenuItemDto } from '../../api/menuApi'
import { logout, selectCompany } from './authSlice'

const NAVBAR_MENU_KEY = 'menu_navbar_cache'
const SIDE_MENU_KEY = 'menu_side_cache'

function readFromSession<T>(key: string): T | null {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function writeToSession(key: string, data: unknown): void {
  try {
    sessionStorage.setItem(key, JSON.stringify(data))
  } catch {
    // ignore quota errors
  }
}

function clearMenuSession(): void {
  sessionStorage.removeItem(NAVBAR_MENU_KEY)
  sessionStorage.removeItem(SIDE_MENU_KEY)
}

export interface MenuState {
  items: MenuDto[]
  sideItems: SideMenuItemDto[]
  menuLoaded: boolean
  sideMenuLoaded: boolean
  loading: boolean
  error: string | null
}

const initialState: MenuState = {
  items: [],
  sideItems: [],
  menuLoaded: false,
  sideMenuLoaded: false,
  loading: false,
  error: null,
}

export const fetchMenu = createAsyncThunk<MenuDto[]>(
  'menu/fetchMenu',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { menu: MenuState }
    if (state.menu.menuLoaded) return state.menu.items

    const cached = readFromSession<MenuDto[]>(NAVBAR_MENU_KEY)
    if (cached && cached.length > 0) return cached

    try {
      const data = await fetchMenuApi()
      writeToSession(NAVBAR_MENU_KEY, data)
      return data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.message || err.message || 'Erro ao carregar menu')
    }
  },
)

export const fetchSideMenu = createAsyncThunk<SideMenuItemDto[]>(
  'menu/fetchSideMenu',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { menu: MenuState }
    if (state.menu.sideMenuLoaded) return state.menu.sideItems

    const cached = readFromSession<SideMenuItemDto[]>(SIDE_MENU_KEY)
    if (cached && cached.length > 0) return cached

    try {
      const data = await fetchSideMenuApi()
      writeToSession(SIDE_MENU_KEY, data)
      return data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } }; message?: string }
      return rejectWithValue(err.response?.data?.message || err.message || 'Erro ao carregar menu lateral')
    }
  },
)

const menuSlice = createSlice({
  name: 'menu',
  initialState,
  reducers: {
    clearMenu(state) {
      state.items = []
      state.sideItems = []
      state.menuLoaded = false
      state.sideMenuLoaded = false
      state.loading = false
      state.error = null
      clearMenuSession()
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMenu.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMenu.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
        state.menuLoaded = true
      })
      .addCase(fetchMenu.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(fetchSideMenu.fulfilled, (state, action) => {
        state.sideItems = action.payload
        state.sideMenuLoaded = true
      })
      // Clear cache on logout
      .addCase(logout, (state) => {
        state.items = []
        state.sideItems = []
        state.menuLoaded = false
        state.sideMenuLoaded = false
        clearMenuSession()
      })
      // Clear cache when company changes so menu reloads for new company
      .addCase(selectCompany.fulfilled, (state) => {
        state.items = []
        state.sideItems = []
        state.menuLoaded = false
        state.sideMenuLoaded = false
        clearMenuSession()
      })
  },
})

export const { clearMenu } = menuSlice.actions
export default menuSlice.reducer
