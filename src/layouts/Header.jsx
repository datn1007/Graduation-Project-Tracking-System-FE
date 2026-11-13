import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GraduationCap, KeyRound, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Avatar } from '../components/ui/Misc'
import './Header.scss'

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [menuOpen])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="site-header">
      <div className="site-header__left">
        <button
          type="button"
          className="btn btn--ghost btn--icon site-header__menu-btn"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? 'Đóng menu' : 'Mở menu'}
          aria-expanded={sidebarOpen}
          aria-controls="app-sidebar"
        >
          {sidebarOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
        <Link to="/" className="brand">
          <span className="brand__logo" aria-hidden="true">
            <GraduationCap />
          </span>
          <span className="brand__text">
            <span className="brand__name">GPTS</span>
            <span className="brand__full">Hệ thống đặt lịch & theo dõi tiến độ đồ án tốt nghiệp</span>
          </span>
        </Link>
      </div>

      <div className="site-header__right">
        <div className="user-menu" ref={menuRef}>
          <button
            type="button"
            className="user-menu__trigger"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <Avatar name={user?.fullName} size="sm" />
            <span className="user-menu__info">
              <span className="user-menu__name">{user?.fullName}</span>
              <span className="user-menu__role">{user?.roleLabel}</span>
            </span>
          </button>
          {menuOpen && (
            <div className="dropdown" role="menu">
              <div className="dropdown__header">
                <div className="user-menu__name">{user?.fullName}</div>
                <div className="text-muted text-small">{user?.email}</div>
              </div>
              {user?.hasPassword && (
                <Link to="/account/password" role="menuitem" className="dropdown__item" onClick={() => setMenuOpen(false)}>
                  <KeyRound aria-hidden="true" /> Đổi mật khẩu
                </Link>
              )}
              <button type="button" role="menuitem" className="dropdown__item" onClick={handleLogout}>
                <LogOut aria-hidden="true" /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
