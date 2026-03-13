import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../redux/hooks'
import { logout } from '../../redux/slices/authSlice'
import { fetchEmpresasComAcesso } from '../../api/empresasApi'
import erpLogo from '../../assets/ERPPequeno2.png'
import './Navbar.css'

const Navbar: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth)
  const menuItems = useAppSelector((state) => state.menu.items)
  const menuLoading = useAppSelector((state) => state.menu.loading)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const profileRef = useRef<HTMLDivElement>(null)

  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [selectedCompanyName, setSelectedCompanyName] = useState('Empresa nao selecionada')

  const showMenu = Boolean(user)
  const isSupportUser = user?.prfTip === 3

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    let cancelled = false
    if (!user?.empCod) {
      setSelectedCompanyName('Empresa nao selecionada')
      return () => { cancelled = true }
    }

    fetchEmpresasComAcesso()
      .then((empresas) => {
        if (cancelled) return
        const selectedEmpresa = empresas.find((empresa) => empresa.empCod === user.empCod)
        if (!selectedEmpresa) {
          setSelectedCompanyName(`Empresa ${user.empCod}`)
          return
        }
        setSelectedCompanyName(selectedEmpresa.empRaz || `Empresa ${selectedEmpresa.empCod}`)
      })
      .catch(() => {
        if (!cancelled) setSelectedCompanyName(`Empresa ${user.empCod}`)
      })

    return () => { cancelled = true }
  }, [user?.empCod])

  const handleLogout = () => {
    setIsProfileOpen(false)
    dispatch(logout())
    navigate('/login')
  }

  const handlePlaceholderAction = () => {
    setIsProfileOpen(false)
  }

  const handleSwitchCompany = () => {
    setIsProfileOpen(false)
    navigate('/select-empresa')
  }

  const handleMenuLink = (e: React.MouseEvent, link: string) => {
    e.preventDefault()
    if (!link || link === '#') return
    if (link.startsWith('/')) navigate(link)
    else if (link.startsWith('http')) window.open(link, '_blank')
    else navigate(`/${link}`)
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-left">
          <div className="navbar-logo">
            <img src={erpLogo} alt="ERP" className="navbar-logo-img" />
          </div>
          {showMenu && (
            <div className="navbar-menu">
              {menuLoading ? (
                <span className="navbar-menu-loading">Carregando...</span>
              ) : (
                <ul className="navbar-menu-list">
                  {menuItems.map((menu) => (
                    <li key={menu.menCod} className="navbar-menu-group">
                      <button type="button" className="navbar-menu-link navbar-menu-group-trigger">
                        {menu.menNom}
                      </button>
                      <div className="navbar-submenu-dropdown">
                        {menu.subMenus.map((sub) => (
                          <div key={`${menu.menCod}-${sub.subMenCod}`} className="navbar-submenu-section">
                            <div className="navbar-submenu-title">{sub.subMenNom}</div>
                            <ul className="navbar-rotina-list">
                              {sub.rotinas.map((rot) => (
                                <li key={rot.rotCod}>
                                  <a
                                    href={rot.rotLin}
                                    onClick={(e) => handleMenuLink(e, rot.rotLin)}
                                    className="navbar-rotina-link"
                                  >
                                    {rot.rotNom}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="navbar-right">
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
                <div className="profile-dropdown-company" title={selectedCompanyName}>
                  <span className="profile-dropdown-company-label">Empresa selecionada</span>
                  <span className="profile-dropdown-company-name">{selectedCompanyName}</span>
                </div>

                <button type="button" className="dropdown-item" onClick={handlePlaceholderAction}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                  <span>Modificar senha</span>
                </button>

                <button type="button" className="dropdown-item" onClick={handlePlaceholderAction}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M7 14h3" />
                    <path d="M7 10h6" />
                    <path d="M7 6h10" />
                    <path d="M7 18h8" />
                  </svg>
                  <span>Visualizar versoes</span>
                </button>

                <button type="button" className="dropdown-item" onClick={handlePlaceholderAction}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4Z" />
                  </svg>
                  <span>Configuracoes</span>
                </button>

                {isSupportUser && (
                  <button type="button" className="dropdown-item" onClick={handleSwitchCompany}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 7h12" />
                      <path d="M3 12h9" />
                      <path d="M3 17h12" />
                      <path d="m16 15 3 3 3-3" />
                      <path d="m19 6 3 3-3 3" />
                    </svg>
                    <span>Trocar de empresa</span>
                  </button>
                )}

                <div className="profile-dropdown-divider" />

                <button type="button" className="dropdown-item" onClick={handleLogout}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Sair</span>
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
