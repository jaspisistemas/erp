import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './features/auth/Login'
import SelecionaEmpresaPage from './features/auth/SelecionaEmpresaPage'
import ModuleSelector from './features/auth/ModuleSelector'
import DashboardLayout from './layouts/DashboardLayout'
import Dashboard from './features/dashboard/Dashboard'
import { AuthGuardFull, AuthGuardToken, AuthGuardWithEmpresa } from './components/AuthGuard'
import './index.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => {}} />} />
        <Route path="/select-empresa" element={<AuthGuardToken><SelecionaEmpresaPage /></AuthGuardToken>} />
        <Route path="/select-module" element={<AuthGuardWithEmpresa><ModuleSelector /></AuthGuardWithEmpresa>} />
        <Route path="/dashboard" element={<AuthGuardFull><DashboardLayout /></AuthGuardFull>}>
          <Route index element={<Dashboard />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  )
}

export default App
