import React from 'react'
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { LoadingState } from '../../components/ui/States'
import ForbiddenPage from './errors/ForbiddenPage'

// Requires a session; otherwise sends the user to /login and remembers where they were going.
export const RequireAuth = ({ children }) => {
  const { status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="fullscreen-center">
        <LoadingState label="Đang khôi phục phiên đăng nhập…" />
      </div>
    )
  }
  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}

// Client-side permission gate for UX. The Backend still answers 403 for missing permissions.
// Forwards the parent's outlet context so guarded child routes (e.g. project tabs) still receive it.
export const RequirePermission = ({ permission }) => {
  const { can } = useAuth()
  const parentContext = useOutletContext()
  if (!can(permission)) return <ForbiddenPage />
  return <Outlet context={parentContext} />
}
