import React from 'react'
import { Link } from 'react-router-dom'
import './errors.scss'

const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-page__code">404</div>
      <h1>Không tìm thấy trang</h1>
      <p>Trang bạn tìm không tồn tại hoặc đã được di chuyển.</p>
      <Link to="/" className="btn btn--primary">
        Về trang chủ
      </Link>
    </div>
  )
}

export default NotFoundPage
