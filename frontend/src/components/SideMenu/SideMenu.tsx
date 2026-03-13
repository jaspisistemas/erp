import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAppSelector } from '../../redux/hooks'
import type { SideMenuItemDto } from '../../api/menuApi'
import './SideMenu.css'

const SIDE_MENU_COOKIE = 'side_menu_collapsed'

function readCollapsedFromCookie(): boolean {
  if (typeof document === 'undefined') return true
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${SIDE_MENU_COOKIE}=`))
    ?.split('=')[1]

  if (raw == null) return true
  return raw === '1'
}

function writeCollapsedToCookie(collapsed: boolean): void {
  if (typeof document === 'undefined') return
  const days = 365
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `${SIDE_MENU_COOKIE}=${collapsed ? '1' : '0'}; expires=${expires}; path=/; SameSite=Lax`
}

const SideMenu: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsedFromCookie())
  const [hoverExpanded, setHoverExpanded] = useState(false)
  const items = useAppSelector((state) => state.menu.sideItems)

  useEffect(() => {
    writeCollapsedToCookie(collapsed)
  }, [collapsed])

  const orderedItems = useMemo(() => {
    const baseItems = items.filter((item) => item.key !== 'modelo-base')
    baseItems.push({
      key: 'modelo-base',
      label: 'Modelo Base',
      link: '/modelo-base',
      icon: null,
      order: -0.5,
      fixed: true,
    })
    return baseItems.sort((a, b) => a.order - b.order)
  }, [items])

  const isExpanded = !collapsed || hoverExpanded

  const getIcon = (item: SideMenuItemDto) => {
    if (item.key === 'modelo-base') {
      return (
        <svg className="side-menu-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 10h8" />
          <path d="M8 14h8" />
        </svg>
      )
    }

    if (item.fixed) {
      return (
        <svg className="side-menu-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 10.5 12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      )
    }

    if (item.icon) {
      return <i className={item.icon} aria-hidden="true" />
    }

    return <span className="side-menu-dot" aria-hidden="true" />
  }

  return (
    <aside
      className={`side-menu ${collapsed ? 'collapsed' : ''} ${collapsed && hoverExpanded ? 'expanded-on-hover' : ''}`}
      onMouseEnter={() => {
        if (collapsed) setHoverExpanded(true)
      }}
      onMouseLeave={() => setHoverExpanded(false)}
    >
      <div className={`side-menu-surface ${collapsed && hoverExpanded ? 'expanded-on-hover' : ''}`}>
        <button
          type="button"
          className="side-menu-toggle"
          onClick={() => {
            setCollapsed((v) => !v)
            setHoverExpanded(false)
          }}
          aria-label={isExpanded ? 'Recolher menu lateral' : 'Expandir menu lateral'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {!isExpanded
              ? <path d="M9 6l6 6-6 6" />
              : <path d="M15 6l-6 6 6 6" />}
          </svg>
          {isExpanded && <span>Menu</span>}
        </button>

        <nav className="side-menu-nav">
          {orderedItems.map((item) => {
            const isActive = location.pathname === item.link || (item.link !== '/dashboard' && location.pathname.startsWith(item.link))
            return (
              <button
                key={item.key}
                type="button"
                className={`side-menu-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.link)}
                title={!isExpanded ? item.label : undefined}
                data-label={item.label}
              >
                <span className="side-menu-icon">{getIcon(item)}</span>
                {isExpanded && <span className="side-menu-label">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default SideMenu
