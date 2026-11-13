import React from 'react'
import { Link } from 'react-router-dom'
import './errors.scss'

const ForbiddenPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-page__code">403</div>
      <h1>Không có quyền truy cập</h1>
      <p>Vai trò hiện tại của bạn không được phép xem trang này. Nếu bạn cho rằng đây là nhầm lẫn, hãy liên hệ Quản trị viên.</p>
      <Link to="/" className="btn btn--primary">
        Về trang chủ của tôi
      </Link>
    </div>
  )
}

export default ForbiddenPage
