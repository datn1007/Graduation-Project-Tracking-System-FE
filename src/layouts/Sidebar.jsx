import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { NAV_SECTIONS } from '../app/routes/navigation'
import './Sidebar.scss'

const Sidebar = ({ open, onClose }) => {
  const { user, can } = useAuth()
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => !item.permission || can(item.permission)),
  })).filter((section) => section.items.length)

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'is-open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside id="app-sidebar" className={`site-sidebar ${open ? 'is-open' : ''}`} aria-label="Điều hướng chính">
        <div className="site-sidebar__role">{user?.roleLabel}</div>
        <nav>
          {sections.map((section) => (
            <div key={section.title || 'main'} className="site-sidebar__section">
              {section.title && <div className="site-sidebar__role">{section.title}</div>}
              <ul>
                {section.items.map(({ to, label, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink to={to} end={end} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}>
                      <Icon aria-hidden="true" />
                      <span>{label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
