import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './features/auth/Login'
import SelecionaEmpresaPage from './features/auth/SelecionaEmpresaPage'
import ModuleSelector from './features/auth/ModuleSelector'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './features/dashboard/Dashboard'
import ModeloBase from './features/modelo-base'
import ModeloBasePrompt from './features/modelo-base-prompt'
import { AuthGuardFull, AuthGuardToken, AuthGuardWithEmpresa } from './components/AuthGuard'
import './index.css'

const SCREEN_TITLES: Record<string, string> = {
  '/login': 'Login',
  '/select-empresa': 'Selecionar Empresa',
  '/select-module': 'Selecione o Modulo',
  '/dashboard': 'Dashboard',
  '/modelo-base': 'Modelo Base',
  '/modelo-base-prompt': 'Prompt de Consulta',
}

function RouteTitleSync() {
  const location = useLocation()

  useEffect(() => {
    document.title = SCREEN_TITLES[location.pathname] ?? 'ERP'
  }, [location.pathname])

  return null
}

function App() {
  return (
    <Router>
      <RouteTitleSync />
      <Routes>
        <Route path="/login" element={<Login onLogin={() => {}} />} />
        <Route element={<AuthGuardToken><DashboardLayout /></AuthGuardToken>}>
          <Route path="/select-empresa" element={<SelecionaEmpresaPage />} />
          <Route path="/select-module" element={<AuthGuardWithEmpresa><ModuleSelector /></AuthGuardWithEmpresa>} />
          <Route path="/dashboard" element={<AuthGuardFull><Dashboard /></AuthGuardFull>} />
          <Route path="/modelo-base" element={<AuthGuardFull><ModeloBase /></AuthGuardFull>} />
          <Route path="/modelo-base-prompt" element={<AuthGuardFull><ModeloBasePrompt /></AuthGuardFull>} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
