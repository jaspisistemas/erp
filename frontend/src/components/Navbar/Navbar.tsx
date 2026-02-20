import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../redux/hooks'
import { getTokenPayload } from '../../api/tokenManager'
import { fetchMenu } from '../../api/menuApi'
import { fetchModules } from '../../api/modulesApi'
import type { MenuItemDto } from '../../api/menuApi'
import type { ModuloDto } from '../../api/modulesApi'
import { selectModule, logout } from '../../redux/slices/authSlice'
import { useAppDispatch } from '../../redux/hooks'
import './Navbar.css'

const Navbar: React.FC = () => {
  const { user, activeModuleId } = useAppSelector((state) => state.auth)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const profileRef = useRef<HTMLDivElement>(null)
  const moduleRef = useRef<HTMLDivElement>(null)

  const [menuItems, setMenuItems] = useState<MenuItemDto[]>([])
  const [menuLoading, setMenuLoading] = useState(false)
  const [modules, setModules] = useState<ModuloDto[]>([])
  const [modulesLoading, setModulesLoading] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false)

  const fromToken = getTokenPayload()?.activeModuleId
  const effectiveModuleId = activeModuleId ?? fromToken ?? ''
  const showMenuAndModule = Boolean(effectiveModuleId)

  useEffect(() => {
    if (!showMenuAndModule) return
    let cancelled = false
    setMenuLoading(true)
    fetchMenu(effectiveModuleId)
      .then((data) => { if (!cancelled) setMenuItems(data) })
      .catch(() => { if (!cancelled) setMenuItems([]) })
      .finally(() => { if (!cancelled) setMenuLoading(false) })
    return () => { cancelled = true }
  }, [showMenuAndModule, effectiveModuleId])

  useEffect(() => {
    if (!showMenuAndModule) return
    let cancelled = false
    setModulesLoading(true)
    fetchModules()
      .then((data) => { if (!cancelled) setModules(data) })
      .catch(() => { if (!cancelled) setModules([]) })
      .finally(() => { if (!cancelled) setModulesLoading(false) })
    return () => { cancelled = true }
  }, [showMenuAndModule])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false)
      if (moduleRef.current && !moduleRef.current.contains(target)) setIsModuleDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsProfileOpen(false)
    dispatch(logout())
    navigate('/login')
  }

  const handleModuleSelect = async (modCod: string) => {
    setIsModuleDropdownOpen(false)
    await dispatch(selectModule(modCod))
    navigate('/dashboard')
  }

  const handleMenuLink = (e: React.MouseEvent, link: string) => {
    e.preventDefault()
    if (!link || link === '#') return
    if (link.startsWith('/')) navigate(link)
    else if (link.startsWith('http')) window.open(link, '_blank')
    else navigate(`/${link}`)
  }

  const currentModule = modules.find((m) => m.modCod === effectiveModuleId)
  const moduleLabel = currentModule ? (currentModule.modCaption ?? currentModule.modNom ?? currentModule.modCod) : 'Módulo'

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo">
            <span className="navbar-logo-text">Template ERP</span>
          </div>
          {showMenuAndModule && (
            <div className="navbar-menu">
              {menuLoading ? (
                <span className="navbar-menu-loading">Carregando...</span>
              ) : (
                <ul className="navbar-menu-list">
                  {menuItems.map((item, idx) => (
                    <li key={`${item.caption}-${idx}`}>
                      <a
                        href={item.link}
                        onClick={(e) => handleMenuLink(e, item.link)}
                        className="navbar-menu-link"
                      >
                        {item.caption}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="navbar-right">
          {showMenuAndModule && (
            <div className="navbar-module-selector" ref={moduleRef}>
              <button
                type="button"
                className="navbar-module-button"
                onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
              >
                <span className="navbar-module-label">{moduleLabel}</span>
                <svg className="navbar-module-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>
              {isModuleDropdownOpen && (
                <div className="navbar-module-dropdown">
                  {modulesLoading ? (
                    <div className="navbar-module-loading">Carregando...</div>
                  ) : (
                    modules.map((mod) => (
                      <button
                        key={mod.modCod}
                        type="button"
                        className={`navbar-module-option ${mod.modCod === effectiveModuleId ? 'active' : ''}`}
                        onClick={() => handleModuleSelect(mod.modCod)}
                      >
                        {mod.modCaption ?? mod.modNom ?? mod.modCod}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          <div className="navbar-profile" ref={profileRef}>
            <button
              type="button"
              className="profile-button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              aria-label="Menu do usuário"
            >
              <span className="profile-user-name">{user?.name ?? 'Usuário'}</span>
              <div className="profile-avatar">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </button>
            {isProfileOpen && (
              <div className="profile-dropdown">
                <button type="button" className="dropdown-item" onClick={handleLogout}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sair do Sistema</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
