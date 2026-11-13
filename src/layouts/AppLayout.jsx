import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import Footer from './Footer'
import './AppLayout.scss'

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Bỏ qua tới nội dung chính
      </a>
      <Header onToggleSidebar={() => setSidebarOpen((open) => !open)} sidebarOpen={sidebarOpen} />
      <div className="app-body">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="app-content">
          <main className="app-main" id="main-content" tabIndex={-1}>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
}

export default AppLayout
