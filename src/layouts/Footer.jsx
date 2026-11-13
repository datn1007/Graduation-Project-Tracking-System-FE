import React from 'react'
import './Footer.scss'

const Footer = () => {
  return (
    <footer className="site-footer">
      <div>© {new Date().getFullYear()} Hệ thống Đặt lịch và Theo dõi tiến độ đồ án</div>
    </footer>
  )
}

export default Footer
