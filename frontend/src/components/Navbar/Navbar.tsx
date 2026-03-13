import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '../../redux/hooks'
import { logout } from '../../redux/slices/authSlice'
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

  const showMenu = Boolean(user)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (profileRef.current && !profileRef.current.contains(target)) setIsProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = () => {
    setIsProfileOpen(false)
    dispatch(logout())
    navigate('/login')
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
