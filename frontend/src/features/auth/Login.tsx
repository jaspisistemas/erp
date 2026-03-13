import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Login.css'
import { useAppDispatch, useAppSelector } from '../../redux/hooks'
import { login } from '../../redux/slices/authSlice'
import { fetchMenu, fetchSideMenu } from '../../redux/slices/menuSlice'
import loginBg from '../../assets/backgroundLogin.jpg'

interface LoginProps {
  onLogin: () => void
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const action = await dispatch(login({ username, password }))
    if (login.fulfilled.match(action)) {
      onLogin()
      const nextStep = action.payload?.nextStep
      if (nextStep === 'dashboard') {
        await Promise.all([dispatch(fetchMenu()), dispatch(fetchSideMenu())])
        navigate('/dashboard')
      } else if (nextStep === 'select-company') {
        navigate('/select-empresa')
      } else {
        await Promise.all([dispatch(fetchMenu()), dispatch(fetchSideMenu())])
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="login-page" style={{ backgroundImage: `url(${loginBg})` }}>
      <div className="login-container">
        <div className="login-card">
          <div className="login-card-form">
            <h2 className="login-form-title">Login</h2>
            <p className="login-form-subtitle">Bem-vindo ao portal corporativo.</p>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="username">Usuário *</label>
                <input
                  type="text"
                  id="username"
                  className="form-input"
                  placeholder="Seu usuário"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Senha *</label>
                <div className="form-input-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-input"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="form-input-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" strokeLinecap="round" strokeLinejoin="round" />
                        <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="login-form-error">{error}</div>
              )}

              <div className="form-options">
                <label className="checkbox-group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={loading}
                  />
                  Manter conectado
                </label>
                <a href="#" className="forgot-password">Recuperar Senha</a>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? 'Entrando...' : 'Acessar'}
              </button>

              <p className="login-version">V. 1.0.0</p>
            </form>

            <footer className="login-form-footer">
              <span>© {new Date().getFullYear()} ERP. Todos os direitos reservados.</span>
              <span className="login-footer-links">
                <a href="#">POLÍTICA DE PRIVACIDADE</a>
                <span className="login-footer-sep">·</span>
                <a href="#">TERMOS DE USO</a>
                <span className="login-footer-sep">·</span>
                <a href="#">SUPORTE</a>
              </span>
            </footer>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
